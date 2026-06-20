'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';
import { memberInputSchema, type MemberInput, type MemberStatus } from '@/server/members/schemas';
import { createMemberAction, updateMemberAction } from '@/server/members/actions';
import { cn } from '@/lib/utils';
import { ButtonSpinner } from '@/components/ui/loading';
import { NativeSelect } from '@/components/ui/native-select';
import { katakanaForFirstName } from '@/lib/katakana';

interface Props {
  mode: 'create' | 'edit';
  memberId?: string;
  dojos: Array<{ id: string; name: string }>;
  initial: {
    firstName: string;
    firstNameKatakana?: string | null;
    lastName: string;
    code?: string | null;
    curp?: string | null;
    email?: string | null;
    phone?: string | null;
    emergencyPhone?: string | null;
    dateOfBirth?: string | null;
    bloodType?: string | null;
    specialCareNotes?: string | null;
    dojoId: string;
    status: MemberStatus;
    notes?: string | null;
  };
}

type FormShape = {
  firstName: string;
  firstNameKatakana: string;
  lastName: string;
  code: string;
  curp: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  dateOfBirth: string;
  bloodType: string;
  specialCareNotes: string;
  dojoId: string;
  status: MemberStatus;
  notes: string;
};

/**
 * Field-level styling: 44 px tall (iOS HIG) and 16 px font (prevents iOS zoom-on-focus).
 */
const INPUT_CLASS =
  'min-h-11 rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function MemberForm({ mode, memberId, dojos, initial }: Props) {
  const t = useTranslations('members.form');
  const tErrors = useTranslations('members.form.errors');
  const tValidation = useTranslations('members.form.validation');
  const tStatus = useTranslations('members.list.status');
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const initialFirstName = useRef(initial.firstName ?? '');
  const initialFirstNameKatakana = useRef(initial.firstNameKatakana ?? '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormShape>({
    resolver: zodResolver(memberInputSchema),
    defaultValues: {
      firstName: initial.firstName ?? '',
      firstNameKatakana: initial.firstNameKatakana ?? '',
      lastName: initial.lastName ?? '',
      code: initial.code ?? '',
      curp: initial.curp ?? '',
      email: initial.email ?? '',
      phone: initial.phone ?? '',
      emergencyPhone: initial.emergencyPhone ?? '',
      dateOfBirth: initial.dateOfBirth ?? '',
      bloodType: initial.bloodType ?? '',
      specialCareNotes: initial.specialCareNotes ?? '',
      dojoId: initial.dojoId,
      status: initial.status,
      notes: initial.notes ?? '',
    },
  });
  const firstName = watch('firstName');

  useEffect(() => {
    const generatedKatakana = katakanaForFirstName(firstName);
    const value =
      mode === 'edit' &&
      firstName === initialFirstName.current &&
      initialFirstNameKatakana.current
        ? initialFirstNameKatakana.current
        : generatedKatakana;

    setValue('firstNameKatakana', value, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [firstName, mode, setValue]);

  async function onSubmit(values: FormShape) {
    setServerError(null);
    const generatedKatakana = katakanaForFirstName(values.firstName);
    const payload: MemberInput = {
      ...values,
      firstNameKatakana: generatedKatakana || values.firstNameKatakana || undefined,
      code: values.code || undefined,
      curp: values.curp || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      emergencyPhone: values.emergencyPhone || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      bloodType: values.bloodType || undefined,
      specialCareNotes: values.specialCareNotes || undefined,
      notes: values.notes || undefined,
    };
    const res =
      mode === 'create'
        ? await createMemberAction(payload)
        : await updateMemberAction(memberId!, payload);
    if (!res.ok) {
      setServerError(res.error ? tErrors(res.error) : tErrors('generic'));
      return;
    }
    router.push({
      pathname: '/members/[id]',
      params: { id: res.data?.id ?? memberId! },
    });
    router.refresh();
  }

  function field<K extends keyof FormShape>(
    name: K,
    label: string,
    type = 'text',
    extra: {
      inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
      autoComplete?: string;
      readOnly?: boolean;
      description?: string;
    } = {},
  ) {
    const fieldId = String(name);
    const errorMessage = translateValidationError(errors[name]?.message);
    const descriptionId = extra.description ? `${fieldId}-description` : undefined;
    const errorId = errorMessage ? `${fieldId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        <input
          id={name}
          type={type}
          inputMode={extra.inputMode}
          autoComplete={extra.autoComplete}
          readOnly={extra.readOnly}
          aria-describedby={describedBy}
          {...register(name)}
          className={cn(
            INPUT_CLASS,
            name === 'firstNameKatakana' && 'font-japanese',
            extra.readOnly &&
              'cursor-default border-periwinkle/50 bg-periwinkle/15 text-foreground',
          )}
        />
        {extra.description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {extra.description}
          </p>
        )}
        {errorMessage && (
          <p id={errorId} className="text-xs text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  function translateValidationError(message: unknown) {
    switch (message) {
      case 'required':
      case 'invalidEmail':
      case 'invalidCurp':
      case 'invalidDate':
      case 'invalidDojo':
      case 'invalidStatus':
      case 'tooLong40':
      case 'tooLong10':
      case 'tooLong80':
      case 'tooLong120':
      case 'tooLong1000':
      case 'tooLong2000':
        return tValidation(message);
      default:
        return message ? tErrors('validationFailed') : null;
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('firstName', t('firstName'), 'text', { autoComplete: 'given-name' })}
        {field('firstNameKatakana', t('firstNameKatakana'), 'text', {
          readOnly: true,
          description: t('firstNameKatakanaAuto'),
        })}
        {field('lastName', t('lastName'), 'text', { autoComplete: 'family-name' })}
        {field('code', t('code'))}
        {field('curp', t('curp'))}
        {field('email', t('email'), 'email', { inputMode: 'email', autoComplete: 'email' })}
        {field('phone', t('phone'), 'tel', { inputMode: 'tel', autoComplete: 'tel' })}
        {field('emergencyPhone', t('emergencyPhone'), 'tel', {
          inputMode: 'tel',
          autoComplete: 'tel',
        })}
        {field('dateOfBirth', t('dateOfBirth'), 'date', { autoComplete: 'bday' })}
        {field('bloodType', t('bloodType'))}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dojoId" className="text-sm font-medium">
            {t('dojo')}
          </label>
          <NativeSelect id="dojoId" {...register('dojoId')} wrapperClassName="w-full">
            {dojos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
          {errors.dojoId && (
            <p className="text-xs text-destructive">
              {translateValidationError(errors.dojoId.message)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            {t('status')}
          </label>
          <NativeSelect id="status" {...register('status')} wrapperClassName="w-full">
            <option value="active">{tStatus('active')}</option>
            <option value="temporary_leave">{tStatus('temporary_leave')}</option>
            <option value="permanent_leave">{tStatus('permanent_leave')}</option>
            <option value="recovery">{tStatus('recovery')}</option>
            <option value="sick">{tStatus('sick')}</option>
          </NativeSelect>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="specialCareNotes" className="text-sm font-medium">
          {t('specialCareNotes')}
        </label>
        <textarea
          id="specialCareNotes"
          rows={3}
          {...register('specialCareNotes')}
          className={cn(INPUT_CLASS, 'min-h-24')}
        />
        {errors.specialCareNotes && (
          <p className="text-xs text-destructive">
            {translateValidationError(errors.specialCareNotes.message)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          {t('notes')}
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          className={cn(INPUT_CLASS, 'min-h-28')}
        />
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (!isDirty && mode === 'edit')}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {isSubmitting && <ButtonSpinner className="mr-2" />}
          {isSubmitting ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
