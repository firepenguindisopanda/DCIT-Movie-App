import { Component, ViewChild, inject, signal } from '@angular/core';

import { FormBuilder, FormGroup, FormGroupDirective, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-register',
    imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  readonly authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  @ViewChild(FormGroupDirective) private formDirective?: FormGroupDirective;

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  successMessage = signal<string | null>(null);

  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    const { email, password } = this.registerForm.value;
    const result = await this.authService.signUp(email, password);

    if (result.success) {
      if (result.error?.includes('SUCCESS')) {
        // Email confirmation required
        this.successMessage.set(result.error);
        // resetForm (not registerForm.reset) also clears the directive's
        // submitted flag; a bare reset leaves every mat-error showing
        // "required" right under the success banner.
        this.formDirective?.resetForm();
      } else {
        // Auto-login successful
        this.router.navigate([this.returnUrl]);
      }
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.hidePassword.update(v => !v);
    } else {
      this.hideConfirmPassword.update(v => !v);
    }
  }
}
