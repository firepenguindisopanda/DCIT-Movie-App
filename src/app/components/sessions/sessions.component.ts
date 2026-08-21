import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { WatchSessionService, WatchSession } from '../../services/watch-session.service';

@Component({
    selector: 'app-sessions',
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './sessions.component.html',
    styleUrls: ['./sessions.component.scss']
})
export class SessionsComponent implements OnInit {
  private sessionsService = inject(WatchSessionService);
  private auth = inject(AuthService);
  private router = inject(Router);

  sessions = signal<WatchSession[]>([]);
  loading = signal<boolean>(true);

  newTitle = signal<string>('');
  deadline = signal<string>('');
  creating = signal<boolean>(false);
  createError = signal<string | null>(null);

  joinCode = signal<string>('');
  joinError = signal<string | null>(null);
  joining = signal<boolean>(false);

  openSessions = computed(() => this.sessions().filter(s => s.status === 'open'));
  closedSessions = computed(() => this.sessions().filter(s => s.status === 'closed'));

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    const userId = this.auth.user()?.id;
    if (userId) {
      this.sessions.set(await this.sessionsService.getMySessions(userId));
    }
    this.loading.set(false);
  }

  async create(): Promise<void> {
    const title = this.newTitle().trim();
    if (!title) {
      this.createError.set('Give your session a name.');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    const user = this.auth.user();
    // datetime-local yields a naive local string; hand Postgres a real instant.
    const closesAt = this.deadline() ? new Date(this.deadline()).toISOString() : null;

    const { data, error } = await this.sessionsService.createSession(
      user!.id,
      user!.email ?? null,
      title,
      closesAt
    );

    this.creating.set(false);

    if (error || !data) {
      this.createError.set(error ?? 'Could not create the session.');
      return;
    }

    this.newTitle.set('');
    this.deadline.set('');
    this.router.navigate(['/sessions', data.code]);
  }

  async join(): Promise<void> {
    const code = this.joinCode().trim().toUpperCase();
    if (!code) return;

    this.joining.set(true);
    this.joinError.set(null);

    const { data, error } = await this.sessionsService.getSessionByCode(code);
    this.joining.set(false);

    if (error || !data) {
      this.joinError.set(error ?? 'No session found with that code.');
      return;
    }

    this.router.navigate(['/sessions', data.code]);
  }

  isHost(session: WatchSession): boolean {
    return session.host_id === this.auth.user()?.id;
  }
}
