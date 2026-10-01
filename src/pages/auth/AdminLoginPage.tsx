import { useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { login } from '@/services/auth.service';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

interface FormValues {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const challenge = await login(values);
      // Stash the challenge so the OTP page can use it
      sessionStorage.setItem(
        'qrcb_admin_challenge',
        JSON.stringify(challenge)
      );
      toast.success('Verification code sent to your email');
      navigate('/otp', { replace: true });
    } catch (e) {
      const err = e as ApiClientError;
      if (err.code === 'AUTH_INVALID_CREDENTIALS') {
        setError('email', { message: 'Invalid email or password' });
      } else if (err.code === 'AUTH_ACCOUNT_DEACTIVATED') {
        toast.error('This admin account has been disabled');
      } else {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo size={32} />
        <h1 className="text-2xl font-black tracking-tight text-white">
          Vickkyaku Admin
        </h1>
        <p className="mt-2 text-[12.5px] font-medium text-ink-400">
          Sign in with your admin credentials
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-surface-border bg-[#0a0e17]/80 p-6 backdrop-blur shadow-elevated">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="admin@vickkyaku.local"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={submitting}
          >
            Continue
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/[.03] p-3 ring-1 ring-inset ring-white/5">
          <span className="text-base leading-none">🔐</span>
          <p className="text-[11.5px] font-medium leading-relaxed text-ink-400">
            Two-factor authentication is mandatory. A 6-digit code will be sent to
            your email after credentials are verified.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] font-semibold text-ink-600">
        Isolated admin environment · v1.0.0
      </p>
    </div>
  );
}
