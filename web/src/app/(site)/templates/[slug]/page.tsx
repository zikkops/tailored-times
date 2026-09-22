import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/OrderForm";
import { PreviewSlider } from "@/components/PreviewSlider";
import { getPricing, getTemplate } from "@/lib/data";

export async function generateMetadata(props: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const t = await getTemplate(slug);
  return t ? { title: `${t.name} Template`, description: t.blurb } : {};
}

// Same layout as the live template pages: page previews on the left, title,
// blurb and the calculator/order card on the right.
export default async function TemplatePage(props: PageProps<"/templates/[slug]">) {
  const { slug } = await props.params;
  const [template, pricing] = await Promise.all([getTemplate(slug), getPricing()]);
  if (!template) notFound();

  return (
    <div className="mx-auto grid max-w-[1140px] items-start gap-10 px-4 py-6 md:grid-cols-[400px_1fr]">
      <div className="md:sticky md:top-6">
        <PreviewSlider images={template.previewImages} name={template.name} />
      </div>
      <div className="pt-4">
        <h1 className="font-script text-3xl text-ink sm:text-[34px]">{template.name} Template</h1>
        <p className="mt-3 font-roboto text-base leading-relaxed text-muted">{template.blurb}</p>
        <OrderForm
          template={{ slug: template.slug, name: template.name, formSchema: template.formSchema }}
          pricing={pricing}
        />
      </div>
    </div>
  );
}
