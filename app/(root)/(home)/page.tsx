import { Metadata } from 'next'
import Image from "next/image";
import { FaGithub } from 'react-icons/fa6';
import { FaEnvelope } from 'react-icons/fa6';

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
                <div className="h-16 flex flex-row items-center">
                  <a href="/about">About</a>
                  <a href="/projects">Projects</a>
                  <a href="/contact">Contact</a>
                </div>
              </div>
            </div>
          </header>

        <main className="max-sm:pt-17 pt-16 mx-auto w-full max-w-screen-xl">
            <section className="lg:w-3/4 py-12 mx-auto px-6 md:px-8 xl:px-12">
                <div className="mb-12 flex flex-col items-center justify-center md:flex-row">
                  <div className="md:ms-0 md:me-8 md:pe-8 md:border-e mx-auto w-48 flex-none">
                    <Image src="/avatar.jpg" className="rounded-full" alt="portfolio" width={500} height={500} />
                  </div>
                  <div>
                    <h1 className="py-4 text-3xl">About</h1>
                    <div className="w-3/12 border-b xl:w-2/12"></div>
                    <p className="py-8 text-lg leading-normal text-secondary-text">
                      Hi there! My name is Yash Agarwal, and I am currently working with Averlon Technologies as a Software Engineer.
                      I am interested in building scalable and reliable backend systems using go and python. Also I am a big fan of
                      kafka and distributed systems.
                    </p>
                  </div>
                  <div className="md:ms-8 flex items-end justify-center md:flex-col">
                    <div className="mx-2 mb-2 mt-4 md:mx-0 md:mt-2">
                      <a href="https://www.github.com/yashagw">
                        <FaGithub />
                      </a>
                    </div>
                    <div className="mx-2 mb-2 mt-4 md:mx-0 md:mt-2">
                      <a href="mailto:yash.ag@outlook.com">
                        <FaEnvelope />
                      </a>
                    </div>
                  </div>
                </div>
            </section>
        </main>

    </div>
  )
}