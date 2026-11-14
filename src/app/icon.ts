import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'whatsapp'
  | 'instagram'
  | 'arrow'
  | 'plus'
  | 'minus'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'pin'
  | 'clock'
  | 'star'
  | 'spark'
  | 'bag'
  | 'hand'
  | 'check'
  | 'trash';

/** Iconos SVG en línea (sin sprites, para no depender de <base href>). */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'icon' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" focusable="false">
      @switch (name()) {
        @case ('whatsapp') {
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
          />
        }
        @case ('instagram') {
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
        }
        @case ('arrow') {
          <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        }
        @case ('minus') {
          <path d="M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        }
        @case ('chevron-left') {
          <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        }
        @case ('chevron-right') {
          <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        }
        @case ('chevron-down') {
          <path d="M5 9l7 7 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        }
        @case ('pin') {
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        }
        @case ('star') {
          <path fill="currentColor" d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" />
        }
        @case ('spark') {
          <path fill="currentColor" d="M12 2c.6 4.9 2.9 7.3 8 8-5.1.7-7.4 3.1-8 8-.6-4.9-2.9-7.3-8-8 5.1-.7 7.4-3.1 8-8z" />
          <path fill="currentColor" d="M19 15c.2 1.8 1.1 2.7 3 3-1.9.3-2.8 1.2-3 3-.2-1.8-1.1-2.7-3-3 1.9-.3 2.8-1.2 3-3z" />
        }
        @case ('bag') {
          <path d="M5 8h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        }
        @case ('hand') {
          <path
            d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-.5v-6a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V12m0-2.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.7-2.300L3.600 15a1.6 1.6 0 0 1 2.5-2L8 15"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
        @case ('check') {
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        }
        @case ('trash') {
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
