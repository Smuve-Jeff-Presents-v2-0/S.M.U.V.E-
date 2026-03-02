import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div
        *ngFor="let n of notificationService.notifications()"
        class="pointer-events-auto px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animate__animated animate__slideInRight"
        [ngClass]="{
          'bg-emerald-950/90 border-emerald-500 text-emerald-400': n.type === 'success',
          'bg-red-950/90 border-red-500 text-red-400': n.type === 'error',
          'bg-blue-950/90 border-blue-500 text-blue-400': n.type === 'info',
          'bg-orange-950/90 border-orange-500 text-orange-400': n.type === 'warning'
        }"
      >
        <i class="fas" [ngClass]="{
          'fa-check-circle': n.type === 'success',
          'fa-times-circle': n.type === 'error',
          'fa-info-circle': n.type === 'info',
          'fa-exclamation-triangle': n.type === 'warning'
        }"></i>
        <span class="font-bold tracking-tight uppercase text-sm">{{ n.message }}</span>
        <button (click)="notificationService.remove(n.id)" class="ml-2 hover:opacity-70">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotificationToastComponent {
  notificationService = inject(NotificationService);
}
