"use client";

const feedback = {
  quote: "A few people who have come across this early project have shared kind, encouraging feedback. We’re taking those first reactions as motivation to keep improving it.",
};

export function TestimonialCarousel() {
  return <div className="testimonial-shell"><div className="quote-mark">“</div><div className="rating" aria-label="Early project feedback">A NOTE OF THANKS</div><blockquote>{feedback.quote}</blockquote><div className="testimonial-footer"><div className="client-avatar" aria-hidden="true">✳</div><div><b>Early feedback</b><span>Shared by people who found the project</span></div></div></div>;
}
