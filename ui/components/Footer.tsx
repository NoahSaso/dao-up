import SvgDiscord from "./icons/Discord"
import SvgGithub from "./icons/Github"
import SvgTwitter from "./icons/Twitter"

export const Footer = () => {
  return (
    <div className="w-full p-6 flex-col items-center justify-center text-green">
      <div className="flex gap-4 justify-center items-center my-4">
        <a
          href="https://github.com/NoahSaso/dao-up"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-primary"
        >
          <SvgGithub fill="currentColor" width="20px" height="20px" />
        </a>
        <a
          href="https://twitter.com/da0_up"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-primary"
        >
          <SvgTwitter fill="currentColor" width="20px" height="20px" />
        </a>
        <a
          href="https://discord.gg/sAaGuyW3D2"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-primary"
        >
          <SvgDiscord fill="currentColor" width="20px" height="20px" />
        </a>
      </div>
      <p className="mt-6 mb-4 flex justify-center text-sm font-mono">
        Powered by
        <a
          href="https://daodao.zone"
          target="_blank"
          rel="noopener noreferrer"
          className="underline inline ml-2"
        >
          DAO DAO
        </a>
      </p>
    </div>
  )
}
