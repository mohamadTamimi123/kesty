"use client";

import Image from "next/image";
import { useState } from "react";

export default function BrandBookPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const brandColors = [
    { name: "Light Gray", hex: "#d3d6db", usage: "پس‌زمینه‌های روشن" },
    { name: "Dark Blue", hex: "#233b6e", usage: "متن اصلی و عناصر مهم" },
    { name: "Medium Blue", hex: "#415f9d", usage: "دکمه‌ها و لینک‌ها" },
    { name: "Light Sky", hex: "#cde6f8", usage: "پس‌زمینه‌های آبی روشن" },
    { name: "Off White", hex: "#eff0f2", usage: "پس‌زمینه اصلی" },
    { name: "Medium Gray", hex: "#b7bcc4", usage: "مرزها و جداکننده‌ها" },
  ];

  const typography = [
    {
      name: "IRANSansX",
      description: "فونت اصلی برای متن‌های فارسی و انگلیسی",
      weights: ["Regular (400)", "Bold (700)"],
      usage: "متن‌های بدنه، دکمه‌ها، منوها",
    },
    {
      name: "Lahzeh Variable",
      description: "فونت متغیر برای عناوین و متن‌های خاص",
      weights: ["100-900 (Variable)"],
      usage: "عناوین، لوگو، عناصر برجسته",
    },
  ];

  const shadows = [
    {
      name: "Small",
      class: "shadow-sm",
      css: "box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);",
      usage: "کارت‌های کوچک، دکمه‌ها",
    },
    {
      name: "Medium",
      class: "shadow-md",
      css: "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);",
      usage: "کارت‌های اصلی، منوها",
    },
    {
      name: "Large",
      class: "shadow-lg",
      css: "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);",
      usage: "مُدال‌ها، پاپ‌آپ‌ها",
    },
    {
      name: "Brand",
      class: "shadow-brand",
      css: "box-shadow: 0 4px 14px 0 rgba(35, 59, 110, 0.15);",
      usage: "عناصر برند، CTA",
    },
  ];

  const animations = [
    {
      name: "Fade In",
      class: "animate-fade-in",
      usage: "ظاهر شدن محتوا",
    },
    {
      name: "Slide In",
      class: "animate-slide-in",
      usage: "اسلاید از راست",
    },
    {
      name: "Pulse",
      class: "animate-pulse-slow",
      usage: "توجه‌دهی به عناصر",
    },
    {
      name: "Hover Scale",
      class: "hover:scale-105 transition-transform",
      usage: "تعامل با دکمه‌ها و کارت‌ها",
    },
  ];

  const copyToClipboard = (text: string, colorName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    }
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <section className="text-center mb-16 animate-fade-in">
          <div className="mb-8">
            <Image
              src="/keesti logo.png"
              alt="Keesti Logo"
              width={200}
              height={200}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-brand-dark-blue font-display">
            برند بوک
          </h1>
          <p className="text-xl text-brand-medium-blue max-w-2xl mx-auto">
            راهنمای کامل هویت بصری و استانداردهای طراحی
          </p>
        </section>

        {/* Colors Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            پالت رنگ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandColors.map((color) => (
              <div
                key={color.hex}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => copyToClipboard(color.hex, color.hex)}
              >
                <div
                  className="w-full h-32 rounded-lg mb-4 shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: color.hex }}
                />
                <h3 className="text-lg font-semibold mb-2 text-brand-dark-blue">
                  {color.name}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-brand-off-white px-3 py-1 rounded text-brand-medium-blue">
                    {color.hex}
                  </code>
                  {copiedColor === color.hex && (
                    <span className="text-sm text-green-600 animate-fade-in">
                      کپی شد!
                    </span>
                  )}
                </div>
                <p className="text-sm text-brand-medium-blue">
                  {color.usage}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            تایپوگرافی
          </h2>
          <div className="space-y-8">
            {typography.map((font, index) => (
              <div
                key={font.name}
                className="bg-white rounded-lg shadow-md p-8 animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3
                  className="text-4xl font-bold mb-4"
                  style={{ fontFamily: font.name === "IRANSansX" ? "IRANSansX" : "Lahzeh Variable" }}
                >
                  {font.name}
                </h3>
                <p className="text-lg mb-4 text-brand-medium-blue">
                  {font.description}
                </p>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-brand-dark-blue">
                    وزن‌های موجود:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {font.weights.map((weight) => (
                      <span
                        key={weight}
                        className="px-3 py-1 bg-brand-light-sky rounded text-sm text-brand-medium-blue"
                      >
                        {weight}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-zinc-500">
                  <strong>کاربرد:</strong> {font.usage}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Shadows Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            سایه‌ها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shadows.map((shadow) => (
              <div
                key={shadow.name}
                className={`bg-white rounded-lg p-6 ${shadow.class}`}
              >
                <h3 className="text-xl font-semibold mb-3 text-brand-dark-blue">
                  {shadow.name}
                </h3>
                <code className="block text-xs font-mono bg-brand-off-white p-3 rounded mb-3 text-brand-medium-blue overflow-x-auto">
                  {shadow.css}
                </code>
                <p className="text-sm text-brand-medium-blue">
                  {shadow.usage}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Animations Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            انیمیشن‌ها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {animations.map((animation) => (
              <div
                key={animation.name}
                className={`bg-white rounded-lg shadow-md p-6 ${animation.class}`}
              >
                <h3 className="text-xl font-semibold mb-3 text-brand-dark-blue">
                  {animation.name}
                </h3>
                <code className="block text-xs font-mono bg-brand-off-white p-3 rounded mb-3 text-brand-medium-blue">
                  {animation.class}
                </code>
                <p className="text-sm text-brand-medium-blue">
                  {animation.usage}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Logo Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            لوگو
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-8">
              <div className="text-center">
                <div className="bg-brand-off-white p-8 rounded-lg mb-4 inline-block">
                  <Image
                    src="/keesti logo.png"
                    alt="Keesti Logo"
                    width={150}
                    height={150}
                  />
                </div>
                <p className="text-sm text-brand-medium-blue">
                  پس‌زمینه روشن
                </p>
              </div>
              <div className="text-center">
                <div className="bg-brand-dark-blue p-8 rounded-lg mb-4 inline-block">
                  <Image
                    src="/keesti logo.png"
                    alt="Keesti Logo"
                    width={150}
                    height={150}
                    className="brightness-0 invert"
                  />
                </div>
                <p className="text-sm text-brand-medium-blue">
                  پس‌زمینه تیره
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-dark-blue">
                دستورالعمل‌های استفاده:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-brand-medium-blue">
                <li>حداقل فاصله اطراف لوگو باید 20% از عرض لوگو باشد</li>
                <li>از تغییر رنگ، کشیدگی یا اعوجاج لوگو خودداری کنید</li>
                <li>در پس‌زمینه‌های تیره از نسخه معکوس استفاده کنید</li>
                <li>حداقل اندازه لوگو: 100px × 100px</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            دکمه‌ها
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="px-6 py-3 rounded-full bg-brand-medium-blue text-white font-medium hover:bg-brand-dark-blue transition-colors shadow-md hover:shadow-lg hover:scale-105">
                دکمه اصلی
              </button>
              <button className="px-6 py-3 rounded-full border-2 border-brand-medium-blue text-brand-medium-blue font-medium hover:bg-brand-light-sky transition-colors">
                دکمه ثانویه
              </button>
              <button className="px-6 py-3 rounded-full bg-brand-light-gray text-brand-dark-blue font-medium hover:bg-brand-medium-gray transition-colors">
                دکمه خنثی
              </button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-dark-blue">
                استایل‌های دکمه:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-brand-medium-blue">
                <li>دکمه اصلی: برای اقدامات مهم و CTA</li>
                <li>دکمه ثانویه: برای اقدامات فرعی</li>
                <li>دکمه خنثی: برای اقدامات کم‌اهمیت</li>
                <li>همه دکمه‌ها دارای انیمیشن hover و transition هستند</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Spacing Section */}
        <section className="mb-20 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-brand-dark-blue border-b-2 border-brand-medium-blue pb-4 font-display">
            فاصله‌گذاری
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="space-y-6">
              {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
                <div key={size} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-mono text-brand-medium-blue">
                    {size}px
                  </div>
                  <div className="flex-1 h-8 bg-brand-light-sky rounded" style={{ width: `${size * 4}px` }} />
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-brand-medium-blue">
              استفاده از سیستم فاصله‌گذاری 4px برای هماهنگی بصری
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

