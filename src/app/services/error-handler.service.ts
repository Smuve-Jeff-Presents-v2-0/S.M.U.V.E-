import { ErrorHandler, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor() {}

  handleError(error: any): void {
    console.error('S.M.U.V.E Critical System Error:', error);

    // In a real app, we would send this to an error monitoring service

    const message = error.message ? error.message : error.toString();
    console.warn('Attempting system recovery for error:', message);
  }
}
