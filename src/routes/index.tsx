import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { CalendarioApp } from "@/components/CalendarioApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ferie Flow · Calendario Ferie e Permessi" },
      {
        name: "description",
        content:
          "Gestisci e traccia ferie, permessi, malattie e smart working del tuo team con un calendario mensile condiviso.",
      },
      { property: "og:title", content: "Ferie Flow · Calendario Ferie e Permessi" },
      {
        property: "og:description",
        content:
          "Gestisci e traccia ferie, permessi, malattie e smart working del tuo team con un calendario mensile condiviso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly>
      <CalendarioApp />
    </ClientOnly>
  );
}
