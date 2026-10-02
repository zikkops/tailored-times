import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/OrderForm";
import { PreviewSlider } from "@/components/PreviewSlider";
import { getCustomer } from "@/lib/account";
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
  const [template, pricing, customer] = await Promise.all([getTemplate(slug), getPricing(), getCustomer()]);
  if (!template) notFound();

  // Signed in? Start the delivery step from their saved details.
  const you = customer
    ? {
        name: customer.profile?.full_name ?? "",
        phone: customer.profile?.phone ?? "",
        email: customer.email,
        address: customer.profile?.address ?? "",
      }
    : null;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-6 md:grid-cols-[minmax(0,460px)_1fr] lg:gap-14 xl:grid-cols-[minmax(0,560px)_1fr]">
      {/* The previews stay centred in the window (below the sticky header) for
          as long as the form beside them is still scrolling past. */}
      <div>
        <div className="md:sticky md:top-28 md:h-[calc(100vh-9rem)] md:py-2">
          <PreviewSlider images={template.previewImages} name={template.name} />
        </div>
      </div>
      <div className="pt-4">
        <h1 className="font-script text-3xl text-ink sm:text-[34px]">{template.name} Template</h1>
        <p className="mt-3 font-roboto text-base leading-relaxed text-muted">{template.blurb}</p>
        <OrderForm
          template={{ slug: template.slug, name: template.name, formSchema: template.formSchema }}
          pricing={pricing}
          you={you}
        />
      </div>
    </div>
  );
}
