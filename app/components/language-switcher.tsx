import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { i18n } from "~/i18n/i18n.config";

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  return (
    <Form method="post" className="flex gap-2">
      {i18n.supportedLocales.map((locale) => (
        <Button
          key={locale}
          type="submit"
          name="locale"
          value={locale}
          variant={currentLocale === locale ? "default" : "outline"}
          size="sm"
        >
          {locale.toUpperCase()}
        </Button>
      ))}
    </Form>
  );
} 