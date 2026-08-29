import { type FC } from 'react';
import { clsx } from 'clsx';
import { Drawer } from 'vaul';

import './SampleContent.css';

const SampleContent: FC<{ 
    snap: number | string | null 
}> = ({ snap }) => {

    return (
        <div className={clsx('vaul-body', {
            'vaul-body-scroll': snap === 1,
            'vaul-body-clip': snap !== 1,
        })}
        >
            <div className="vaul-stars-row">
                <svg
                    className="vaul-star"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                    ></path>
                </svg>
                <svg
                    className="vaul-star"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                    ></path>
                </svg>
                <svg
                    className="vaul-star"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                    ></path>
                </svg>
                <svg
                    className="vaul-star"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                    ></path>
                </svg>
                <svg
                    className="vaul-star"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                    ></path>
                </svg>
            </div>
            <Drawer.Title className="vaul-title">The Hidden Details</Drawer.Title>
            <p className="vaul-subtitle">40 videos, 20+ exercises</p>
            <p className="vaul-paragraph">
                The world of user interface design is an intricate landscape filled with hidden details and nuance. In
                this course, you will learn something cool. To the untrained eye, a beautifully designed UI.
            </p>
            <button className="vaul-cta" type="button">
                Buy for $199
            </button>
            <div className="vaul-section">
                <h2 className="vaul-section-title">Module 01. The Details</h2>
                <div className="vaul-items-list">
                    <div>
                        <span className="vaul-item-title">Layers of UI</span>
                        <span className="vaul-item-copy">A basic introduction to Layers of Design.</span>
                    </div>
                    <div>
                        <span className="vaul-item-title">Typography</span>
                        <span className="vaul-item-copy">The fundamentals of type.</span>
                    </div>
                    <div>
                        <span className="vaul-item-title">UI Animations</span>
                        <span className="vaul-item-copy">Going through the right easings and durations.</span>
                    </div>
                </div>
            </div>
            <div className="vaul-section">
                <figure>
                    <blockquote className="vaul-quote">
                        “I especially loved the hidden details video. That was so useful, learned a lot by just reading it.
                        Can&rsquo;t wait for more course content!”
                    </blockquote>
                    <figcaption>
                        <span className="vaul-caption">Yvonne Ray, Frontend Developer</span>
                    </figcaption>
                </figure>
            </div>
            <div className="vaul-section">
                <h2 className="vaul-section-title">Module 02. The Process</h2>
                <div className="vaul-items-list">
                    <div>
                        <span className="vaul-item-title">Build</span>
                        <span className="vaul-item-copy">Create cool components to practice.</span>
                    </div>
                    <div>
                        <span className="vaul-item-title">User Insight</span>
                        <span className="vaul-item-copy">Find out what users think and fine-tune.</span>
                    </div>
                    <div>
                        <span className="vaul-item-title">Putting it all together</span>
                        <span className="vaul-item-copy">Let&apos;s build an app together and apply everything.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default SampleContent;

