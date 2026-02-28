import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

interface GenreItem {
  id: number;
  name: string;
  type: 'movie' | 'game';
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  private supabase = inject(SupabaseService);
  authService = inject(AuthService);

  movieGenres = signal<GenreItem[]>([]);
  gameGenres = signal<GenreItem[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadGenres();
  }

  async loadGenres(): Promise<void> {
    const [movieResult, gameResult] = await Promise.all([
      this.supabase.getGenres(),
      this.supabase.getGameGenres()
    ]);

    if (movieResult.data) {
      this.movieGenres.set(
        movieResult.data.map(g => ({ ...g, type: 'movie' as 'movie' }))
      );
    }

    if (gameResult.data) {
      this.gameGenres.set(
        gameResult.data.map(g => ({ ...g, type: 'game' as 'game' }))
      );
    }
  }
}
