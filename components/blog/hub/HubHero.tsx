interface Props {
  flag: string;
  name: string;
  title: string;
  description: string;
  speakers: string;
  fsiHours: number;
  difficultyRating: 1 | 2 | 3 | 4 | 5;
}

export default function HubHero({ flag, name, title, description, speakers, fsiHours, difficultyRating }: Props) {
  const filledStars = difficultyRating;
  const emptyStars = 5 - difficultyRating;

  return (
    <header className="bg-gradient-to-b from-accent/10 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-6xl md:text-7xl mb-4 block">{flag}</span>
          <h1 className="text-3xl md:text-5xl font-black font-header text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            {description}
          </p>

          <div className="flex justify-center gap-6 md:gap-10 text-sm">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-gray-900">{speakers}</div>
              <div className="text-gray-500">Speakers</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-gray-900">{fsiHours}h</div>
              <div className="text-gray-500">To Fluency</div>
            </div>
            {/* Star ratings removed */}
            {/*<div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-accent">
                {'★'.repeat(filledStars)}{'☆'.repeat(emptyStars)}
              </div>
              <div className="text-gray-500">Difficulty</div>
            </div>*/}
          </div>
        </div>
      </div>
    </header>
  );
}
