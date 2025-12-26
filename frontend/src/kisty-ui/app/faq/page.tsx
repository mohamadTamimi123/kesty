"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "کیستی چیست؟",
    answer:
      "کیستی یک پلتفرم آنلاین است که کارفرمایان و مهندسین را به بهترین کارگاه‌های تولیدی در سراسر ایران متصل می‌کند. شما می‌توانید درخواست ساخت قطعه سفارشی خود را ثبت کنید و پیشنهادات مختلف از تولیدکنندگان دریافت کنید.",
  },
  {
    question: "چگونه می‌توانم به عنوان تولیدکننده ثبت نام کنم؟",
    answer:
      "برای ثبت نام به عنوان تولیدکننده، روی دکمه 'ثبت نام به عنوان تولیدکننده' کلیک کنید و فرم ثبت نام را تکمیل کنید. پس از تایید اطلاعات، می‌توانید پروفایل کارگاه خود را تکمیل و شروع به دریافت درخواست‌های پروژه کنید.",
  },
  {
    question: "چگونه می‌توانم درخواست ساخت قطعه ثبت کنم؟",
    answer:
      "پس از ثبت نام به عنوان مشتری، وارد داشبورد خود شوید و روی 'ثبت درخواست جدید' کلیک کنید. فرم درخواست را با اطلاعات پروژه، فایل‌های مربوطه و مشخصات مورد نیاز تکمیل کنید.",
  },
  {
    question: "هزینه استفاده از پلتفرم چقدر است؟",
    answer:
      "استفاده از پلتفرم برای کاربران رایگان است. تولیدکنندگان می‌توانند به صورت رایگان درخواست‌ها را مشاهده کنند و با مشتریان ارتباط برقرار کنند.",
  },
  {
    question: "چگونه می‌توانم با تولیدکننده ارتباط برقرار کنم؟",
    answer:
      "پس از ثبت درخواست پروژه، تولیدکنندگان مرتبط می‌توانند درخواست شما را مشاهده کنند و از طریق سیستم پیام‌رسان داخلی با شما ارتباط برقرار کنند.",
  },
  {
    question: "آیا می‌توانم چندین درخواست همزمان ثبت کنم؟",
    answer:
      "بله، شما می‌توانید به تعداد نامحدود درخواست پروژه ثبت کنید. هر درخواست به صورت مستقل مدیریت می‌شود.",
  },
  {
    question: "چگونه می‌توانم از کیفیت کار تولیدکننده اطمینان حاصل کنم؟",
    answer:
      "شما می‌توانید پروفایل تولیدکننده را بررسی کنید که شامل نمونه کارها، نظرات مشتریان قبلی، امتیاز کلی و اطلاعات تماس است. همچنین می‌توانید قبل از شروع پروژه با تولیدکننده گفتگو کنید.",
  },
  {
    question: "آیا می‌توانم تولیدکننده را تغییر دهم؟",
    answer:
      "بله، تا زمانی که پروژه شروع نشده باشد، می‌توانید با تولیدکننده دیگری همکاری کنید. توصیه می‌کنیم قبل از شروع کار، تمام جزئیات را با تولیدکننده مورد نظر خود بررسی کنید.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
            سوالات متداول
          </h1>
          <p className="text-lg text-brand-medium-blue">
            پاسخ سوالات رایج شما درباره پلتفرم کیستی
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-right hover:bg-brand-light-sky transition-colors"
              >
                <span className="text-lg font-semibold text-brand-dark-blue flex-1">
                  {item.question}
                </span>
                {openIndex === index ? (
                  <ChevronUpIcon className="w-5 h-5 text-brand-medium-blue flex-shrink-0 mr-3" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-brand-medium-blue flex-shrink-0 mr-3" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 border-t border-brand-medium-gray">
                  <p className="text-brand-medium-blue leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-brand-light-sky rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-brand-dark-blue mb-4 font-display">
            سوال شما را پیدا نکردید؟
          </h3>
          <p className="text-brand-medium-blue mb-6">
            می‌توانید از طریق صفحه تماس با ما، سوال خود را بپرسید.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-brand-medium-blue text-white font-medium rounded-lg hover:bg-brand-dark-blue transition-colors"
          >
            تماس با ما
          </a>
        </div>
      </div>
    </div>
  );
}

