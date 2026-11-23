// Adapted from pi-sidebar-tui 1.7.8 (MIT, bi0h4z4rd88): https://github.com/bi0h4z4rd88/pi-sidebar-tui
//
// Pi has no side-panel API. This narrows `terminal.columns` so Pi lays out in
// the left part of the screen, then paints the panel into the freed columns
// inside Pi's own render frame.
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export type PanelRenderer = (width: number, rows: number) => string[];

function moveCursor(row: number, column: number): string {
	return `\x1b[${row};${column}H`;
}

function descriptorFor(object: object, key: string): PropertyDescriptor | undefined {
	let target: object | null = object;
	while (target) {
		const descriptor = Object.getOwnPropertyDescriptor(target, key);
		if (descriptor) return descriptor;
		target = Object.getPrototypeOf(target);
	}
	return undefined;
}

export class SidePanelCompositor {
	private tui: any;
	private panelWidth: number;
	private renderPanel: PanelRenderer;
	private onWheel: (row: number, delta: number) => void;
	private separator: (text: string) => string;
	private terminal: any;
	private originalColumnsDescriptor: PropertyDescriptor | undefined;
	private originalColumnsOwnDescriptor: PropertyDescriptor | undefined;
	private originalDoRender: ((...args: any[]) => any) | null = null;
	private originalRouteWheel: ((event: any, delta: number) => void) | null = null;
	private originalWrite: (data: string) => void;
	private disposed = false;
	private paintedLines: string[] = [];
	private paintedSize = "";

	constructor(
		tui: any,
		panelWidth: number,
		renderPanel: PanelRenderer,
		onWheel: (row: number, delta: number) => void,
		separator: (text: string) => string,
	) {
		this.tui = tui;
		this.panelWidth = panelWidth;
		this.renderPanel = renderPanel;
		this.onWheel = onWheel;
		this.separator = separator;
		this.terminal = tui.terminal;
		this.originalWrite = this.terminal.write.bind(this.terminal);
	}

	install(): void {
		this.originalColumnsDescriptor = descriptorFor(this.terminal, "columns");
		this.originalColumnsOwnDescriptor = Object.getOwnPropertyDescriptor(this.terminal, "columns");
		const compositor = this;
		Object.defineProperty(this.terminal, "columns", {
			configurable: true,
			enumerable: true,
			get() {
				return compositor.mainWidth();
			},
		});

		// Merge the panel into Pi's render frame: one synchronized-output block,
		// and Pi's full-line erase (2K) rewritten to erase only the main area so
		// it never wipes the panel columns.
		if (typeof this.tui.doRender === "function") {
			const originalDoRender = this.tui.doRender;
			this.originalDoRender = originalDoRender;
			const terminal = this.terminal;
			this.tui.doRender = function (...args: any[]) {
				if (compositor.disposed) return originalDoRender.apply(this, args);
				const writeOwnDescriptor = Object.getOwnPropertyDescriptor(terminal, "write");
				const originalWrite = terminal.write;
				const mainWidth = compositor.mainWidth();
				let forceFullPaint = false;
				compositor.originalWrite("\x1b[?2026h");
				try {
					Object.defineProperty(terminal, "write", {
						configurable: true,
						enumerable: true,
						writable: true,
						value(this: any, data: string) {
							if (typeof data !== "string") return originalWrite.call(this, data);
							if (/\x1b\[(?:2J|3J)|\n|\r\n|\x1b\[\d*[ST]|\x1bM/.test(data)) forceFullPaint = true;
							const sanitized = data.replace(/\x1b\[\?2026[hl]/g, "").replace(/\x1b\[2K/g, `\x1b[${mainWidth}X`);
							return originalWrite.call(this, sanitized);
						},
					});
					const result = originalDoRender.apply(this, args);
					try {
						compositor.paintInternal(forceFullPaint, false);
					} catch {
						// Panel painting must never break Pi's render cycle.
					}
					return result;
				} finally {
					if (writeOwnDescriptor) Object.defineProperty(terminal, "write", writeOwnDescriptor);
					else Reflect.deleteProperty(terminal, "write");
					compositor.originalWrite("\x1b[?2026l");
				}
			};
		}

		// routeWheel is the fullscreen-mode fallback wheel handler.
		if (typeof this.tui.routeWheel === "function") {
			const originalRouteWheel = this.tui.routeWheel;
			this.originalRouteWheel = originalRouteWheel;
			this.tui.routeWheel = function (event: any, delta: number) {
				const column = typeof event?.x === "number" ? event.x : -1;
				if (compositor.disposed || column < compositor.separatorColumn() - 1) {
					return originalRouteWheel.call(compositor.tui, event, delta);
				}
				compositor.onWheel((event?.y ?? 0) + 1, delta);
			};
		}
	}

	paint(): void {
		this.paintInternal(false, true);
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		if (this.originalColumnsOwnDescriptor) Object.defineProperty(this.terminal, "columns", this.originalColumnsOwnDescriptor);
		else Reflect.deleteProperty(this.terminal, "columns");
		if (this.originalDoRender) this.tui.doRender = this.originalDoRender;
		if (this.originalRouteWheel) this.tui.routeWheel = this.originalRouteWheel;
	}

	private rawColumns(): number {
		const descriptor = this.originalColumnsDescriptor;
		const raw = descriptor?.get ? descriptor.get.call(this.terminal) : descriptor?.value;
		return typeof raw === "number" && Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 80;
	}

	private mainWidth(): number {
		return Math.max(1, this.rawColumns() - this.panelWidth - 1);
	}

	private separatorColumn(): number {
		return this.rawColumns() - this.panelWidth;
	}

	private paintInternal(forceFull: boolean, standalone: boolean): void {
		if (this.disposed) return;
		const rows = this.terminal.rows;
		const separatorColumn = this.separatorColumn();
		const rendered = this.renderPanel(this.panelWidth, rows);
		const lines: string[] = [];
		for (let index = 0; index < rows; index++) {
			const content = truncateToWidth(rendered[index] ?? "", this.panelWidth, "", true);
			lines.push(content + " ".repeat(Math.max(0, this.panelWidth - visibleWidth(content))));
		}

		// Repaint only changed rows; full repaints every frame cause flicker.
		const size = `${this.rawColumns()}x${rows}x${this.panelWidth}`;
		const repaintAll = forceFull || size !== this.paintedSize;
		const changedRows = lines.flatMap((line, index) => (repaintAll || this.paintedLines[index] !== line ? [index] : []));
		if (changedRows.length === 0) return;

		let buffer = standalone ? "\x1b[?2026h" : "";
		buffer += "\x1b7\x1b[?7l";
		for (const index of changedRows) {
			buffer += moveCursor(index + 1, separatorColumn) + this.separator("│");
			buffer += moveCursor(index + 1, separatorColumn + 1) + lines[index];
		}
		buffer += "\x1b[?7h\x1b8";
		if (standalone) buffer += "\x1b[?2026l";
		this.originalWrite(buffer);
		this.paintedLines = lines;
		this.paintedSize = size;
	}
}
