import "@/components/HeroComponent/index.scss"
import wavingHand from "@/assets/waving-hand.png"
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import { createElement } from "react";

type Props = {}

const HeroComponent = (props: Props) => {
  return (
    <section className="hero">
        <div className="container">
            <div className='content'>
                <div className="hero-text">
                    <h1>Front-End React Developer</h1>
                    <img src={wavingHand} alt="waving-hand"/>
                    <p>
                        Hi, I'm Yash Agarwal. A passionate Full stack
                        developer from India. I love to code and
                        explore new technologies.
                    </p>
                    <span>
                        <a aria-label="linkedin" rel="noreferrer" target="_blank" href="https://www.linkedin.com/in/yash-agarwal-b07280200/">
                            {createElement(AiFillLinkedin)}
                        </a>
                        <a aria-label="github" rel="noreferrer" target="_blank" href="https://github.com/yashagw">
                            {createElement(AiFillGithub)}
                        </a>
                    </span>
                </div>
                <div className="hero-img"></div>
            </div>
        </div>
    </section>
  )
}

export default HeroComponent