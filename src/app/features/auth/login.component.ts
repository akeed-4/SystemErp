import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {ReactiveFormsModule, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../core/services/auth.service';
import {ErpService} from '../../core/services/erp.service';
import {TranslationService} from '../../core/services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  public authService = inject(AuthService);
  public erpService = inject(ErpService);
  public i18n = inject(TranslationService);
  private router = inject(Router);

  public showPassword = signal<boolean>(false);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  public loginForm = new FormGroup({
    email: new FormControl('admin@alofuq.com.sa', [Validators.required, Validators.email]),
    password: new FormControl('••••••••••', [Validators.required, Validators.minLength(6)]),
    rememberMe: new FormControl(true),
  });

  public togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  public onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.loginForm.invalid) {
      this.errorMessage.set(
        this.i18n.isArabic()
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور بصيغة صحيحة.'
          : 'Please enter a valid email and password.'
      );
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const email = this.loginForm.get('email')?.value || '';
      const password = this.loginForm.get('password')?.value || '';

      const res = this.authService.login(email, password);
      this.isLoading.set(false);

      if (res.success) {
        this.successMessage.set(res.message);
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 600);
      } else {
        this.errorMessage.set(res.message);
      }
    }, 450);
  }

  public selectDemoAccount(userId: string) {
    this.authService.loginAsDemoUser(userId);
  }
}
