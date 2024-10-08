/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useResendOtp, useVerifyOtp } from '@/reactquery';
import { setUser } from '@/store/slices/authSlice';
import { setIsLoading } from '@/store/slices/loaderSlice';
import { AppDispatch } from '@/store/store';
import { responseType } from '@/utils/types';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Link, useLocation, useNavigate } from 'react-router-dom';

const VerifyOtp = () => {
  const otpRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [resendOtpEnabled, setResendOtpEnabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const [otpState, setOtpState] = useState({
    otp: '',
    error: '',
    success: '',
  });
  function changeHandler(value: string) {
    if (value.length < 4) {
      setOtpState({
        otp: otpState.otp + value,
        error: ' Please enter a valid OTP',
        success: '',
      });
    } else {
      setOtpState({
        otp: value,
        error: '',
        success: '',
      });
      if (value.length === 6) verifyOtpHandler(value);
    }
  }

  const { mutateAsync, isPending } = useVerifyOtp();
  async function verifyOtpHandler(otp: string) {
    // e.preventDefault();
    if (otp.length < 4) {
      setOtpState({
        otp: '',
        error: 'Please enter a valid OTP',
        success: '',
      });
      return;
    }
    try {
      dispatch(setIsLoading(true));
      const res: responseType = await mutateAsync({ otp: otp, email });
      if (!res.status) {
        setOtpState({
          otp: '',
          error: res.message,
          success: '',
        });
        if (otpRef.current) otpRef.current.value = '';

        dispatch(setIsLoading(false));
        return;
      } else {
        dispatch(setUser(res.data));
        navigate('/in');
        dispatch(setIsLoading(false));
      }
    } catch (error) {
      console.error('Error verifying OTP', error);
    }
  }

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setEmail(email);
    }
  }, []);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setResendOtpEnabled(true);
    }
  }, [countdown]);

  const { mutateAsync: resendOtp, isPending: resendOtpPending } =
    useResendOtp();

  const handleResendOtp = async (e: any) => {
    e.preventDefault();
    try {
      const res: responseType = await resendOtp({ email });

      if (!res.status) {
        setOtpState({
          otp: '',
          error: res.message,
          success: '',
        });
        if (otpRef.current) otpRef.current.value = '';
      } else {
        setOtpState({
          otp: '',
          error: '',
          success: res.message,
        });
        if (otpRef.current) otpRef.current.value = '';
      }
      setResendOtpEnabled(false);
      setCountdown(60);
    } catch (error) {
      console.error('Error resending OTP', error);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verifyOtpHandler(otpState.otp);
      }}
    >
      <Card className="sm:w-[360px] mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Confirm it's you</CardTitle>
          <CardDescription>
            Please enter the verification code that has been sent to
            <p className="inline-block ml-2 text-white">
              <b>{email}</b>
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                // value={otpState.otp}
                ref={otpRef}
                id="otp"
                onChange={(value) => changeHandler(value)} //changeHandler(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-[50px] h-[60px]" />
                  <InputOTPSlot index={1} className="w-[50px] h-[60px]" />
                  <InputOTPSlot index={2} className="w-[50px] h-[60px]" />
                  <InputOTPSlot index={3} className="w-[50px] h-[60px]" />
                  <InputOTPSlot index={4} className="w-[50px] h-[60px]" />
                  <InputOTPSlot index={5} className="w-[50px] h-[60px]" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {otpState.error && (
              <p className="text-xs text-red-500">{otpState.error}</p>
            )}

            {otpState.success && (
              <p className="text-xs text-green-500">{otpState.success}</p>
            )}

            {!resendOtpEnabled && (
              <p className="text-sm text-center">Resend code in {countdown}s</p>
            )}
            {resendOtpEnabled && (
              <button
                onClick={(e) => handleResendOtp(e)}
                className="text-sm text-blue-600"
              >
                {resendOtpPending ? 'Resending...' : 'Resend code'}
              </button>
            )}
            <Button
              type="submit"
              className="w-full disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isPending}
            >
              {isPending ? 'Verifying...' : 'Verify'}
            </Button>

            <Button variant={'outline'}>
              <Link to="/login" className="w-full ">
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default VerifyOtp;
