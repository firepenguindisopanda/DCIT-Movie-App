import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * The "double feature" board: a two-title cinema letterboard where the
 * active catalog (Movies / Games) is the lit title. Replaces the stock
 * Material tab bar on Home and My List.
 */
@Component({
  selector: 'app-double-feature-toggle',
  template: `
    <div class="feature-board" role="tablist" [attr.aria-label]="label">
      <button type="button"
              role="tab"
              class="feature-tab"
              [class.lit]="active === 0"
              [attr.aria-selected]="active === 0"
              [tabindex]="active === 0 ? 0 : -1"
              (click)="select(0)"
              (keydown)="onKeydown($event)">
        <span class="tab-title">Movies</span>
        @if (movieCount !== null) {
          <span class="tab-count">{{ movieCount }}</span>
        }
      </button>
      <button type="button"
              role="tab"
              class="feature-tab"
              [class.lit]="active === 1"
              [attr.aria-selected]="active === 1"
              [tabindex]="active === 1 ? 0 : -1"
              (click)="select(1)"
              (keydown)="onKeydown($event)">
        <span class="tab-title">Games</span>
        @if (gameCount !== null) {
          <span class="tab-count">{{ gameCount }}</span>
        }
      </button>
    </div>
  `,
  styles: [`
.feature-board
  display: inline-flex
  gap: 4px
  padding: 4px
  background: var(--bg-surface)
  border: 1px solid var(--border-subtle)
  border-radius: var(--radius-md)

.feature-tab
  display: inline-flex
  align-items: center
  gap: 10px
  padding: 9px 28px 7px
  border: none
  border-radius: var(--radius-sm)
  background: transparent
  cursor: pointer
  font-family: var(--font-display)
  font-size: 19px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.06em
  color: var(--text-muted)
  transition: color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast)

  &:hover
    color: var(--text-primary)

  // The lit title on the board.
  &.lit
    color: var(--accent-gold)
    background: rgba(255, 199, 44, 0.08)
    box-shadow: inset 0 0 0 1px rgba(255, 199, 44, 0.35)
    text-shadow: 0 0 18px rgba(255, 199, 44, 0.45)

  &:focus-visible
    outline: 2px solid var(--accent-gold)
    outline-offset: 2px

.tab-count
  font-family: var(--font-mono)
  font-size: 11px
  font-weight: 600
  letter-spacing: 0
  padding: 2px 8px
  border-radius: var(--radius-full)
  background: var(--bg-elevated)
  color: var(--text-secondary)

.feature-tab.lit .tab-count
  background: rgba(255, 199, 44, 0.16)
  color: var(--accent-gold)

@media (max-width: 480px)
  .feature-board
    width: 100%

  .feature-tab
    flex: 1
    justify-content: center
    padding: 9px 12px 7px

@media (prefers-reduced-motion: reduce)
  .feature-tab
    transition: none
  `]
})
export class DoubleFeatureToggleComponent {
  @Input() active = 0;
  @Input() label = 'Catalog';
  @Input() movieCount: number | null = null;
  @Input() gameCount: number | null = null;
  @Output() activeChange = new EventEmitter<number>();

  select(index: number): void {
    if (index !== this.active) {
      this.activeChange.emit(index);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = this.active === 0 ? 1 : 0;
    this.activeChange.emit(next);
    // Move focus to the newly lit tab, per the tablist keyboard pattern.
    const board = (event.currentTarget as HTMLElement).parentElement;
    queueMicrotask(() => {
      const tabs = board?.querySelectorAll<HTMLButtonElement>('.feature-tab');
      tabs?.[next]?.focus();
    });
  }
}
