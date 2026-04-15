import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthCredentials } from '../../services/auth.service';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private logger = inject(LoggingService);

  isRegistering = signal(false);
  isLoading = signal(false);
  message = signal<string | null>(null);

  credentials: AuthCredentials = {
    email: '',
    password: '',
    artistName: '',
  };

  toggleMode() {
    this.isRegistering.update((v) => !v);
    this.message.set(null);
  }

  async onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.message.set('Please fill in all required fields.');
      return;
    }

    this.isLoading.set(true);
    this.message.set(null);

    try {
      let result;
      if (!this.isRegistering()) {
        result = await this.authService.login(this.credentials);
      } else {
        result = await this.authService.register(this.credentials);
      }

      if (result.success) {
        this.router.navigate(['/hub']);
      } else {
        this.message.set(result.message || 'Authentication failed.');
      }
    } catch (err) {
      this.logger.error('Login error', err);
      this.message.set('A system error occurred. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
