import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

export type EmailContent = {
  subject: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  action: string;
  url: string;
};

export function EmailLayout({ preview, heading, paragraphs, action, url }: EmailContent) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f1f5f6", color: "#0b1d3a", fontFamily: "Arial, sans-serif", margin: 0, padding: "28px 12px" }}>
        <Container style={{ maxWidth: 560, backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #dce5e8" }}>
          <Section style={{ backgroundColor: "#0b1d3a", borderRadius: "12px 12px 0 0", padding: "18px 24px" }}>
            <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, margin: 0 }}>VentureMatch</Text>
          </Section>
          <Section style={{ padding: "12px 24px 24px" }}>
            <Heading as="h1" style={{ fontSize: 26, lineHeight: "32px" }}>{heading}</Heading>
            {paragraphs.map((paragraph) => (
              <Text key={paragraph} style={{ fontSize: 16, lineHeight: "24px" }}>{paragraph}</Text>
            ))}
            <Button href={url} style={{ backgroundColor: "#006b5b", borderRadius: 8, color: "#ffffff", fontSize: 16, fontWeight: 700, padding: "12px 18px" }}>
              {action}
            </Button>
            <Hr style={{ borderColor: "#dce5e8", marginTop: 28 }} />
            <Text style={{ color: "#42536a", fontSize: 13, marginBottom: 0 }}>VentureMatch · USTED Kumasi</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
