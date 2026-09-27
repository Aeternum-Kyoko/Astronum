import StatusPage from "@/components/StatusPage";

export default function HindiNotFound() {
  return (
    <StatusPage
      code="404"
      title="यह पृष्ठ नहीं मिला"
      body="आप जो पृष्ठ ढूँढ रहे थे वह मौजूद नहीं है या हटा दिया गया है। यहाँ से शुरू करें:"
      links={[
        { href: "/hi", label: "होम" },
        { href: "/hi/horoscope", label: "दैनिक राशिफल" },
        { href: "/hi/panchang", label: "आज का पंचांग" },
        { href: "/kundali", label: "फ्री कुंडली" },
      ]}
    />
  );
}
