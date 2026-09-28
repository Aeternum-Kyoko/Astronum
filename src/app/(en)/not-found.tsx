import StatusPage from "@/components/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="This page isn't in the stars"
      body="The page you were looking for doesn't exist or has moved. Here are some places to start instead."
      links={[
        { href: "/", label: "Home" },
        { href: "/kundali", label: "Free Kundli" },
        { href: "/horoscope", label: "Daily Horoscope" },
        { href: "/panchang", label: "Today's Panchang" },
      ]}
    />
  );
}
