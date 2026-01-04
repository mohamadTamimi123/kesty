"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../lib/api";
import logger from "../utils/logger";
import { getErrorMessage } from "../utils/errorHandler";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.submitContact(formData);
      if (response.success) {
        toast.success(response.message || "پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }
    } catch (error: unknown) {
      logger.error("Error submitting contact form", error);
      toast.error(getErrorMessage(error) || "خطا در ارسال پیام. لطفا دوباره تلاش کنید.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
            تماس با ما
          </h1>
          <p className="text-lg text-brand-medium-blue">
            ما همیشه آماده پاسخگویی به سوالات و دریافت پیشنهادات شما هستیم
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-8">
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
              ارسال پیام
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-brand-dark-blue mb-2"
                >
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-brand-dark-blue mb-2"
                >
                  ایمیل
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-brand-dark-blue mb-2"
                >
                  شماره تماس
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-brand-dark-blue mb-2"
                >
                  موضوع
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="">انتخاب موضوع</option>
                  <option value="support">پشتیبانی</option>
                  <option value="suggestion">پیشنهاد</option>
                  <option value="complaint">شکایت</option>
                  <option value="partnership">همکاری</option>
                  <option value="other">سایر</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-brand-dark-blue mb-2"
                >
                  پیام
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-brand-medium-blue text-white font-medium rounded-lg hover:bg-brand-dark-blue transition-colors"
              >
                ارسال پیام
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-8">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                اطلاعات تماس
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-brand-dark-blue mb-2">ایمیل</h3>
                  <p className="text-brand-medium-blue">support@keesti.com</p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-dark-blue mb-2">تلفن</h3>
                  <p className="text-brand-medium-blue">021-12345678</p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-dark-blue mb-2">آدرس</h3>
                  <p className="text-brand-medium-blue">
                    تهران، خیابان ولیعصر، پلاک 123
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-dark-blue mb-2">ساعات کاری</h3>
                  <p className="text-brand-medium-blue">
                    شنبه تا پنجشنبه: 9 صبح تا 6 عصر
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-light-sky rounded-lg p-6">
              <h3 className="text-lg font-bold text-brand-dark-blue mb-3 font-display">
                نیاز به کمک فوری دارید؟
              </h3>
              <p className="text-brand-medium-blue mb-4">
                می‌توانید از طریق بخش پشتیبانی در داشبورد خود با ما در ارتباط باشید.
              </p>
              <a
                href="mailto:support@keesti.com"
                className="inline-block px-4 py-2 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors"
              >
                ارسال ایمیل
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

