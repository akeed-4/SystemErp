import {ChangeDetectionStrategy, Component, inject, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {ReactiveFormsModule, FormControl, FormGroup, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../core/services/auth.service';
import {ErpService} from '../../core/services/erp.service';
import {TranslationService} from '../../core/services/translation.service';
import {SubscriptionPlan, CompanyRegistrationRequest} from '../../core/models/erp.models';

// Custom validator for Saudi 15-digit VAT number starting and ending with 3
function saudiVatValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const val = String(control.value).replace(/\D/g, '');
  if (val.length !== 15 || !val.startsWith('3') || !val.endsWith('3')) {
    return { invalidSaudiVat: true };
  }
  return null;
}

@Component({
  selector: 'app-register-company',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './register-company.component.html',
})
export class RegisterCompanyComponent {
  public authService = inject(AuthService);
  public erpService = inject(ErpService);
  public i18n = inject(TranslationService);
  private router = inject(Router);

  // Wizard current step: 1 = Plans, 2 = Company, 3 = Admin, 4 = Payment & Confirmation
  public currentStep = signal<number>(1);
  public billingCycle = signal<'monthly' | 'yearly'>('yearly');
  public selectedPlanId = signal<'starter' | 'professional' | 'enterprise'>('professional');
  public selectedPaymentMethod = signal<'mada' | 'credit_card' | 'bank_transfer' | 'apple_pay'>('mada');

  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public registrationResult = signal<{ success: boolean; tenantId: string; message: string; companyName: string } | null>(null);

  // Form Group
  public registerForm = new FormGroup({
    // Step 2: Company Details
    companyNameAr: new FormControl('شركة المستقبل للتقنية والتجارة', [Validators.required, Validators.minLength(3)]),
    companyNameEn: new FormControl('Future Tech & Trade Co.', [Validators.required]),
    vatNumber: new FormControl('310234567800003', [Validators.required, saudiVatValidator]),
    crNumber: new FormControl('1010897654', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    city: new FormControl('الرياض', [Validators.required]),
    address: new FormControl('طريق التخصصي، حي الملقا', [Validators.required]),
    companyPhone: new FormControl('+966 11 234 5678', [Validators.required]),
    companyEmail: new FormControl('info@futuretech.com.sa', [Validators.required, Validators.email]),
    industry: new FormControl('تجارة وتقنية المعلومات', [Validators.required]),

    // Step 3: Admin Details
    adminName: new FormControl('سلطان بن عبدالعزيز', [Validators.required, Validators.minLength(3)]),
    adminEmail: new FormControl('sultan@futuretech.com.sa', [Validators.required, Validators.email]),
    adminPhone: new FormControl('+966 50 999 8877', [Validators.required]),
    password: new FormControl('Pass@2026Secure', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('Pass@2026Secure', [Validators.required]),

    // Step 4: Payment Mock Info
    cardNumber: new FormControl('4111 2222 3333 4444'),
    cardExpiry: new FormControl('12/28'),
    cardCvc: new FormControl('888'),
    agreeTerms: new FormControl(true, [Validators.requiredTrue]),
  });

  public readonly plans = this.authService.plans;

  public selectedPlan = computed<SubscriptionPlan>(() => {
    const list = this.plans();
    const id = this.selectedPlanId();
    return list.find((p) => p.id === id) || list[1];
  });

  public planPrice = computed<number>(() => {
    const plan = this.selectedPlan();
    return this.billingCycle() === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  });

  public vatAmount = computed<number>(() => {
    return Math.round(this.planPrice() * 0.15 * 100) / 100;
  });

  public totalAmount = computed<number>(() => {
    return Math.round((this.planPrice() + this.vatAmount()) * 100) / 100;
  });

  public setBillingCycle(cycle: 'monthly' | 'yearly') {
    this.billingCycle.set(cycle);
  }

  public selectPlan(planId: 'starter' | 'professional' | 'enterprise') {
    this.selectedPlanId.set(planId);
  }

  public setPaymentMethod(method: 'mada' | 'credit_card' | 'bank_transfer' | 'apple_pay') {
    this.selectedPaymentMethod.set(method);
  }

  // Navigation between steps
  public goToStep(step: number) {
    this.errorMessage.set(null);

    if (step > this.currentStep()) {
      // Validate Step 2 before moving to Step 3
      if (this.currentStep() === 2) {
        const companyControls = [
          'companyNameAr',
          'vatNumber',
          'crNumber',
          'city',
          'address',
          'companyPhone',
          'companyEmail',
        ];
        let hasError = false;
        for (const name of companyControls) {
          const ctrl = this.registerForm.get(name);
          if (ctrl && ctrl.invalid) {
            ctrl.markAsTouched();
            hasError = true;
          }
        }
        if (hasError) {
          this.errorMessage.set(
            this.i18n.isArabic()
              ? 'يرجى تصحيح حقول بيانات المنشأة والرقم الضريبي (15 رقم يبدأ وينتهي بـ 3) قبل المتابعة.'
              : 'Please correct company details and 15-digit VAT number before continuing.'
          );
          return;
        }
      }

      // Validate Step 3 before moving to Step 4
      if (this.currentStep() === 3) {
        const adminControls = ['adminName', 'adminEmail', 'adminPhone', 'password', 'confirmPassword'];
        let hasError = false;
        for (const name of adminControls) {
          const ctrl = this.registerForm.get(name);
          if (ctrl && ctrl.invalid) {
            ctrl.markAsTouched();
            hasError = true;
          }
        }

        const pass = this.registerForm.get('password')?.value;
        const confirm = this.registerForm.get('confirmPassword')?.value;
        if (pass !== confirm) {
          this.errorMessage.set(
            this.i18n.isArabic()
              ? 'كلمة المرور وتأكيدها غير متطابقين.'
              : 'Password and confirmation password do not match.'
          );
          return;
        }

        if (hasError) {
          this.errorMessage.set(
            this.i18n.isArabic()
              ? 'يرجى استكمال جميع بيانات المسؤول بشكل صحيح.'
              : 'Please complete all admin account details.'
          );
          return;
        }
      }
    }

    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Complete Registration
  public onSubmitRegistration() {
    this.errorMessage.set(null);

    if (!this.registerForm.get('agreeTerms')?.value) {
      this.errorMessage.set(
        this.i18n.isArabic()
          ? 'يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للاستمرار.'
          : 'Please agree to terms and privacy policy.'
      );
      return;
    }

    this.isLoading.set(true);

    const fv = this.registerForm.value;
    const req: CompanyRegistrationRequest = {
      companyNameAr: fv.companyNameAr || '',
      companyNameEn: fv.companyNameEn || '',
      vatNumber: fv.vatNumber || '',
      crNumber: fv.crNumber || '',
      city: fv.city || 'الرياض',
      address: fv.address || '',
      phone: fv.companyPhone || '',
      email: fv.companyEmail || '',
      industry: fv.industry || 'تجاري',
      planId: this.selectedPlanId(),
      billingCycle: this.billingCycle(),
      paymentMethod: this.selectedPaymentMethod(),
      adminName: fv.adminName || '',
      adminEmail: fv.adminEmail || '',
      adminPhone: fv.adminPhone || '',
      password: fv.password || '',
    };

    setTimeout(() => {
      const res = this.authService.registerCompany(req);
      this.isLoading.set(false);

      if (res.success) {
        this.registrationResult.set({
          success: true,
          tenantId: res.tenantId,
          message: res.message,
          companyName: req.companyNameAr,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.errorMessage.set(res.message);
      }
    }, 850);
  }

  public navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
