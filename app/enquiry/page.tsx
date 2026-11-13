import { connection } from "next/server";
import { ActionForm, Field } from "@/components/forms/action-form";
import { PublicHeader } from "@/components/public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getT } from "@/lib/i18n-server";
import { submitEnquiry } from "./actions";

export default async function EnquiryPage() {
  await connection(); // render per request so renderedAt is fresh
  const t = await getT();
  const renderedAt = String(Date.now());

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("enquiry.title")}</CardTitle>
            <CardDescription>{t("enquiry.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={submitEnquiry} submitLabel={t("enquiry.submit")} successMessage={t("enquiry.thanks")} resetOnSuccess>
              <input type="hidden" name="renderedAt" value={renderedAt} />
              {/* Honeypot: hidden from people, often filled in by bots. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
                <label>
                  Website
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <Field name="name" label={t("enquiry.name")}>
                <Input id="name" name="name" autoComplete="name" required />
              </Field>
              <Field name="phone" label={t("enquiry.phone")}>
                <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
              </Field>
              <Field name="standard" label={t("enquiry.standard")}>
                <NativeSelect id="standard" name="standard" defaultValue="" className="w-full">
                  <NativeSelectOption value="" disabled>
                    {t("enquiry.chooseStandard")}
                  </NativeSelectOption>
                  {[5, 6, 7, 8, 9, 10].map((n) => (
                    <NativeSelectOption key={n} value={n}>
                      {t("enquiry.std", { n })}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field name="message" label={t("enquiry.message")}>
                <Textarea id="message" name="message" rows={3} maxLength={1000} />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
