import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { paymentAPI } from '../services/apiService';
import { EyeIcon } from '../../components/Icons';

interface Plan {
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  icon: string;
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: 0,
    duration: 'Forever',
    features: [
      'Basic scene description',
      'Text reading',
      'Hazard detection',
      'Terrain analysis',
      '5 saved items',
    ],
    icon: '👁️',
  },
  {
    name: 'Basic',
    price: 999,
    duration: '1 Month',
    features: [
      'Everything in Free',
      'Live commentary',
      'People identification',
      '25 saved items',
      'Priority processing',
    ],
    icon: '🌟',
  },
  {
    name: 'Premium',
    price: 1999,
    duration: '1 Month',
    features: [
      'Everything in Basic',
      'Unlimited saved items',
      'Advanced AI features',
      'Offline mode',
      'Priority support',
      'Custom voice commands',
    ],
    popular: true,
    icon: '💎',
  },
  {
    name: 'Device Owner',
    price: 9999,
    duration: '6 Months',
    features: [
      'Everything in Premium',
      'Physical IRIS device',
      'Hardware integration',
      'Extended warranty',
      'Dedicated support',
      'Free shipping',
    ],
    icon: '🎯',
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Premium: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async (plan: Plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (plan.name === 'Free') {
      setMessage('You are already on the Free plan!');
      return;
    }

    setLoading(plan.name);
    setMessage('');

    try {
      // Create order
      const orderResponse = await paymentAPI.createOrder(plan.price, plan.name);
      const { order, key_id } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'IRIS 2.0',
        description: `${plan.name} Plan - ${plan.duration}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: plan.name,
            });

            if (verifyResponse.data.success) {
              updateUser(verifyResponse.data.user);
              setMessage('✅ Payment successful! Your plan has been upgraded.');
              setTimeout(() => navigate('/profile'), 2000);
            }
          } catch (error: any) {
            setMessage('❌ Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#06b6d4', // Cyan-500
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.msg || 'Payment failed'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <EyeIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              IRIS 2.0
            </span>
          </Link>
          {isAuthenticated && (
            <Link
              to="/profile"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
            >
              My Profile
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Unlock the full potential of IRIS Vision Assistant with premium features
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className={`p-4 rounded-lg text-center ${
            message.includes('✅') 
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                  : 'border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                  MOST POPULAR
                </div>
              )}

              {/* Icon */}
              <div className="text-5xl mb-4 text-center">{plan.icon}</div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-white">
                  ₹{plan.price.toLocaleString()}
                </span>
                <p className="text-gray-400 text-sm mt-1">{plan.duration}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handlePurchase(plan)}
                disabled={loading === plan.name || (user?.subscription.plan === plan.name && user?.subscription.status === 'active')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  user?.subscription.plan === plan.name && user?.subscription.status === 'active'
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${loading === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === plan.name ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : user?.subscription.plan === plan.name && user?.subscription.status === 'active' ? (
                  'Current Plan'
                ) : (
                  plan.price === 0 ? 'Get Started' : 'Purchase Now'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-gray-800/50 rounded-lg p-4 cursor-pointer">
              <summary className="text-white font-semibold">How do I cancel my subscription?</summary>
              <p className="text-gray-400 mt-2">
                You can cancel anytime from your profile page. Your plan will remain active until the end of the billing period.
              </p>
            </details>
            <details className="bg-gray-800/50 rounded-lg p-4 cursor-pointer">
              <summary className="text-white font-semibold">What payment methods are accepted?</summary>
              <p className="text-gray-400 mt-2">
                We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay.
              </p>
            </details>
            <details className="bg-gray-800/50 rounded-lg p-4 cursor-pointer">
              <summary className="text-white font-semibold">Is there a free trial?</summary>
              <p className="text-gray-400 mt-2">
                The Free plan is available forever with core features. Upgrade anytime to access premium features.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
