import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type PrivacyPolicySection = {
  title: string;
  content: string;
  items?: string[];
};

type PrivacyPolicyTranslations = {
  title: string;
  lastUpdated: string;
  backToHome: string;
  sections: {
    introduction: PrivacyPolicySection;
    informationCollection: PrivacyPolicySection;
    informationUsage: PrivacyPolicySection;
    dataSecurity: PrivacyPolicySection;
    cookies: PrivacyPolicySection;
    thirdParty: PrivacyPolicySection;
    userRights: PrivacyPolicySection;
    contact: PrivacyPolicySection;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = await getLocale(request);
  return json({ t: translations[locale].privacyPolicy as PrivacyPolicyTranslations });
};

export default function PrivacyPolicy() {
  const { t } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400">{t.lastUpdated}</p>
          </div>

          {/* Content */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 space-y-6">
              {/* Introduction */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.introduction.title}</h2>
                <p className="text-gray-300">{t.sections.introduction.content}</p>
              </section>

              {/* Information Collection */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.informationCollection.title}</h2>
                <p className="text-gray-300">{t.sections.informationCollection.content}</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  {t.sections.informationCollection.items?.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Information Usage */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.informationUsage.title}</h2>
                <p className="text-gray-300">{t.sections.informationUsage.content}</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  {t.sections.informationUsage.items?.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Data Security */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.dataSecurity.title}</h2>
                <p className="text-gray-300">{t.sections.dataSecurity.content}</p>
              </section>

              {/* Cookies */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.cookies.title}</h2>
                <p className="text-gray-300">{t.sections.cookies.content}</p>
              </section>

              {/* Third-Party Services */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.thirdParty.title}</h2>
                <p className="text-gray-300">{t.sections.thirdParty.content}</p>
              </section>

              {/* User Rights */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.userRights.title}</h2>
                <p className="text-gray-300">{t.sections.userRights.content}</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  {t.sections.userRights.items?.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Contact Information */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">{t.sections.contact.title}</h2>
                <p className="text-gray-300">{t.sections.contact.content}</p>
              </section>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">{t.backToHome}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 