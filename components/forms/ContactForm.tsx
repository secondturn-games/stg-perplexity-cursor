/**
 * Contact Form Component
 * Contact form with loading states and validation
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLoading } from '@/hooks/useLoading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { DiceLoader } from '@/components/ui';
import { api } from '@/lib/api';

/**
 * Contact form validation schema
 */
const contactSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  subject: yup
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .required('Subject is required'),
  message: yup
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .required('Message is required'),
});

type ContactFormData = yup.InferType<typeof contactSchema>;

interface ContactFormProps {
  /**
   * Callback on successful submission
   */
  onSuccess?: () => void;

  /**
   * Pre-filled subject
   */
  initialSubject?: string;

  /**
   * Pre-filled message
   */
  initialMessage?: string;
}

/**
 * ContactForm - Contact form with comprehensive loading states
 */
export default function ContactForm({
  onSuccess,
  initialSubject = '',
  initialMessage = '',
}: ContactFormProps) {
  const { isLoading, withLoading } = useLoading({
    defaultTimeout: 30000,
    onError: error => {
      setError(error.message);
    },
  });

  const [loadingMessage, setLoadingMessage] = useState('Sending message...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      subject: initialSubject,
      message: initialMessage,
    },
  });

  const messageValue = watch('message') || '';

  const onSubmit = async (data: ContactFormData) => {
    setError(null);
    setSuccess(false);
    setLoadingMessage('Sending your message...');

    try {
      await withLoading(async () => {
        const { error: apiError } = await api.post('/api/contact', data, {
          loadingDelay: 300,
        });

        if (apiError) {
          throw apiError;
        }

        // Success state
        setSuccess(true);
        setLoadingMessage('Message sent successfully!');

        // Brief delay to show success
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reset form
        reset();

        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again.'
      );
    }
  };

  return (
    <div className='mx-auto max-w-2xl'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='space-y-6'
        aria-label='Contact form'
      >
        {/* Error Alert */}
        {error && (
          <Alert variant='error'>
            <p>{error}</p>
          </Alert>
        )}

        {/* Success Alert */}
        {success && !isLoading && (
          <Alert variant='success' role='status' aria-live='polite'>
            <p>✓ Your message has been sent successfully!</p>
          </Alert>
        )}

        {/* Name Field */}
        <div>
          <label htmlFor='name' className='form-label'>
            Name
          </label>
          <Input
            id='name'
            type='text'
            placeholder='Your full name'
            {...register('name')}
            disabled={isLoading}
            aria-required='true'
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p
              id='name-error'
              className='mt-1 text-sm text-red-600'
              role='alert'
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor='email' className='form-label'>
            Email Address
          </label>
          <Input
            id='email'
            type='email'
            placeholder='your.email@example.com'
            {...register('email')}
            disabled={isLoading}
            aria-required='true'
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p
              id='email-error'
              className='mt-1 text-sm text-red-600'
              role='alert'
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label htmlFor='subject' className='form-label'>
            Subject
          </label>
          <Input
            id='subject'
            type='text'
            placeholder='Brief description of your inquiry'
            {...register('subject')}
            disabled={isLoading}
            aria-required='true'
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
          />
          {errors.subject && (
            <p
              id='subject-error'
              className='mt-1 text-sm text-red-600'
              role='alert'
            >
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor='message' className='form-label'>
            Message
          </label>
          <textarea
            id='message'
            rows={6}
            className='input-field'
            placeholder='Tell us how we can help...'
            {...register('message')}
            disabled={isLoading}
            aria-required='true'
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : 'message-hint'}
          />
          <div className='mt-1 flex items-center justify-between'>
            <p
              id='message-hint'
              className='text-sm text-gray-500'
              aria-live='polite'
            >
              {messageValue.length}/1000 characters
            </p>
          </div>
          {errors.message && (
            <p
              id='message-error'
              className='mt-1 text-sm text-red-600'
              role='alert'
            >
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          className='w-full'
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>

        {/* Help Text */}
        <p className='text-center text-sm text-gray-500'>
          We'll respond to your inquiry within 24 hours
        </p>
      </form>

      {/* Loading Overlay */}
      <DiceLoader isVisible={isLoading} text={loadingMessage} variant='roll' />
    </div>
  );
}
