import { SvgDiscord, SvgGitHub, SvgTwitter } from "@/components"

export const Footer = () => (
  <div
    id="footer"
    className="absolute bottom-0 w-full h-footer p-6 flex-col items-center justify-center bg-dark text-green"
  >
    <div className="flex gap-4 justify-center items-center my-4">
      <a
        href="https://github.com/NoahSaso/dao-up"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:opacity-70"
      >
        <SvgGitHub fill="currentColor" width="20px" height="20px" />
      </a>
      <a
        href="https://twitter.com/da0_up"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:opacity-70"
      >
        <SvgTwitter fill="currentColor" width="20px" height="20px" />
      </a>
      <a
        href="https://discord.gg/sAaGuyW3D2"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:opacity-70"
      >
        <SvgDiscord fill="currentColor" width="20px" height="20px" />
      </a>
    </div>
    <p className="my-4 flex justify-center text-sm font-mono">
      Powered by
      <a
        href="https://daodao.zone"
        target="_blank"
        rel="noopener noreferrer"
        className="underline inline ml-2 transition hover:opacity-70"
      >
        DAO DAO
      </a>
    </p>
  </div>
)
