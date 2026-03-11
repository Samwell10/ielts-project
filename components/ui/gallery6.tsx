"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  tag?: string;
}

interface Gallery6Props {
  heading?: string;
  subheading?: string;
  items?: GalleryItem[];
}

const Gallery6 = ({
  heading = "Practice Modules",
  subheading = "Every module follows official IELTS and CELPIP exam formats.",
  items = [],
}: Gallery6Props) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => { carouselApi.off("select", updateSelection); };
  }, [carouselApi]);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col justify-between md:mb-14 md:flex-row md:items-end lg:mb-16">
          <div className="">
            {/* Section label */}
            <div className="section-label mb-3">Practice Modules</div>
            <h2
              className="mb-2 text-3xl font-black md:text-4xl"
              style={{ color: "var(--foreground)" }}
            >
              Our{" "}
              <em className="not-italic font-black" style={{ color: "var(--purple)" }}>
                interactive
              </em>{" "}
              modules
            </h2>
            <p className="text-base" style={{ color: "var(--muted)" }}>
              {subheading}
            </p>
          </div>

          {/* Prev / Next controls */}
          <div className="mt-8 flex shrink-0 items-center justify-start gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto"
              style={{ borderColor: "rgba(124,58,237,0.3)", color: "var(--purple)" }}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto"
              style={{ borderColor: "rgba(124,58,237,0.3)", color: "var(--purple)" }}
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel — bleeds to edges */}
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            breakpoints: {
              "(max-width: 768px)": { dragFree: true },
            },
          }}
          className="relative left-[-1rem]"
        >
          <CarouselContent className="-mr-4 ml-8 2xl:ml-[max(8rem,calc(50vw-700px+1rem))] 2xl:mr-[max(0rem,calc(50vw-700px-1rem))]">
            {items.map((item) => (
              <CarouselItem key={item.id} className="pl-4 md:max-w-[452px]">
                <a
                  href={item.url}
                  className="group flex flex-col justify-between"
                >
                  {/* Image */}
                  <div className="flex aspect-[3/2] overflow-clip rounded-2xl">
                    <div className="flex-1">
                      <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover object-center"
                        />
                        {/* Gradient overlay */}
                        <div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(124,58,237,0.55) 0%, transparent 60%)",
                          }}
                        />
                        {/* Tag badge */}
                        {item.tag && (
                          <span
                            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: "var(--yellow)",
                              color: "#1a1a2e",
                            }}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div
                    className="mb-2 line-clamp-2 break-words pt-4 text-xl font-black md:mb-3 md:text-2xl"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.title}
                  </div>

                  {/* Summary */}
                  <div
                    className="mb-8 line-clamp-2 text-sm md:mb-10 md:text-base"
                    style={{ color: "var(--muted)" }}
                  >
                    {item.summary}
                  </div>

                  {/* CTA link */}
                  <div
                    className="flex items-center text-sm font-bold transition-all group-hover:gap-2"
                    style={{ color: "var(--purple)" }}
                  >
                    Start module{" "}
                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export { Gallery6 };
