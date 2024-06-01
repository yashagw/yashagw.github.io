import { Metadata } from 'next'
import Image from "next/image";
import { FaGithub } from 'react-icons/fa6';
import { FaEnvelope } from 'react-icons/fa6';
import { Roboto_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const robotoMono = Roboto_Mono({ subsets: ["latin"] });


const TerminalStatement = ({heading, className, children} : {heading: string, className?: string, children?: React.ReactNode}) => {
  return (
    <div className={cn(robotoMono.className, className)}>
      <div >&gt; {heading}</div>
      <div className="text-[#e7d184] w-100 break-all">{children}</div>
    </div>
  )
}

const IntroLink = ({href, icon} : {href: string, icon: React.ReactNode}) => {
  return (
    <div className="mx-2 mb-2 mt-4 md:mx-0 md:mt-2">
      <a href={href}>{icon}</a>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Yash Agarwal Portfolio',
  description: 'Yash Agarwal Portfolio',
}

export default function Page() {
  return (
    <div className="w-full h-full">
        <header className="min-h-16 bg-background fixed z-50 w-full">
          <div className="mx-auto w-full max-w-screen-xl">
            <div className="flex flex-row items-center justify-between flex-wrap px-4 py-4 md:py-0">
              <span className="text-xl font-bold text-foreground">Yash Agarwal&apos;s Website</span>
              <div className="mn-sm:h-12  h-16 flex flex-row items-center gap-2">
                <a href="/">About</a>
                <a href="/">Contact</a>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-screen-xl grow pt-[8rem] sm:pt-[6rem] md:pt-20">
            <section className="lg:w-3/4 mx-auto px-6 md:px-8 xl:px-12">
                <div className="flex flex-col items-center justify-center md:flex-row">
                  <div className="md:ms-0 md:me-8 md:pe-8 md:border-e mx-auto w-48 flex-none">
                    <Image src="/avatar.jpg" className="rounded-full" alt="portfolio" width={500} height={500} />
                  </div>
                  <div>
                    <h1 className="py-4 text-3xl">About</h1>
                    <div className="w-3/12 border-b xl:w-2/12"></div>
                    <p className="pt-8 pb-0 md:pb-8 text-lg leading-normal text-secondary-text">
                      Hi there! My name is Yash Agarwal, and I am currently working with <a href="https://averlon.ai/" target="_blank" className="underline">Averlon Technologies</a> as a Software Engineer.
                      I am interested in building scalable and reliable backend systems using go and python. Also I am a big fan of
                      kafka and distributed systems.
                    </p>
                  </div>
                  <div className="md:ms-8 flex items-end justify-center md:flex-col">
                    <IntroLink href="https://www.github.com/yashagw/" icon={<><FaGithub /></>} />
                    <IntroLink href="mailto:yash.ag@outlook.com" icon={<><FaEnvelope /></>} />
                  </div>
                </div>
            </section>

            <section className="lg:w-3/4 mx-auto px-6 md:px-8 xl:px-12 pt-8 sm:pt-6 md:pt-7">
                <div className="flex flex-row gap-1 w-100 py-1 px-2 bg-[#f5f5f5] rounded-t-lg">
                    <div className="bg-[#f96256] w-3 h-3 rounded-full"></div>
                    <div className="bg-[#fdbc3d] w-3 h-3 rounded-full"></div>
                    <div className="bg-[#33c948] w-3 h-3 rounded-full"></div>
                </div>
                <div className="w-100 bg-[#5a5d7a] px-10 rounded-b-lg space-y-3 py-5">
                  <TerminalStatement heading='Yash.currentLocation'>
                    &quot;Bangalore, India&quot;
                  </TerminalStatement>
                  <TerminalStatement heading='Yash.contactInfo'>
                    [&quot;<a href='mailto:yash.ag@outlook.com' className='text-[#35feff]'>yash.ag@outlook.com</a>&quot;,&quot;<a href="https://www.linkedin.com/in/yashagw/" className='text-[#35feff]' target="_blank">Linkedln</a>&quot;,&quot;<a href="https://www.github.com/yashagw/" className='text-[#35feff]' target="_blank">Github</a>&quot;]
                  </TerminalStatement>
                  <TerminalStatement heading='Yash.resume'>
                  &quot;<a href="https://drive.google.com/file/d/1GQ9fbXXdbGKR66xLCeZJAmXP7mwRr7O0/view?usp=drive_link" target="_blank" className="text-[#35feff]">resume.pdf</a>&quot;
                  </TerminalStatement>
                  <TerminalStatement heading='Yash.skills'>
                    [&quot;go&quot;,&quot;python&quot;,&quot;aws&quot;,&quot;docker&quot;,&quot;kubernetes&quot;]
                  </TerminalStatement>
                  <TerminalStatement heading='Yash.currentlyReading'>
                    &quot;Database Internals&quot;
                  </TerminalStatement>
                </div>
            </section>



        </main>

    </div>
  )
}