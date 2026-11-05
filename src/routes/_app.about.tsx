import { siteConfig } from "@/config/site";

export default function AboutRoute() {
  return (
    <>
      <title>درباره | موویز | دانلود فیلم و سریال</title>
      <article className="prose dark:prose-invert mx-auto max-w-2xl px-5 py-10" dir="ltr">
        <h1>Attribution</h1>
        <p>
          Many thanks to <a href={siteConfig.links.donyayeSerial} target="_blank" rel="noopener noreferrer">DonyayeSerial</a>{" "}
          for publishing their full archive public. If you found this free
          archive useful, please support them in{" "}
          <a href={siteConfig.links.donation} target="_blank" rel="noopener noreferrer">this link</a>.
        </p>
        <p>
          I just made a simple client for personal use based on their data. I
          intend to develop it and add more useful features as long as Internet
          is blocked in Iran.
        </p>
        <p>
          Source code is available on{" "}
          <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
        <p>meow 🧡</p>
      </article>
    </>
  );
}
