import { ArrowRight, Check, CircleAlert, Flame, Trophy } from "lucide-react";

import { TalkHeroWordmark } from "@/components/brand/TalkHeroWordmark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function UIKitPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <TalkHeroWordmark href="" showTagline />

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              TalkHero UI Kit
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Базові компоненти дизайн-системи RC1.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Кнопки</CardTitle>
              <CardDescription>
                Основні дії та стани інтерфейсу.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-3">
              <Button>
                Продовжити
                <ArrowRight />
              </Button>

              <Button variant="secondary">Другорядна</Button>

              <Button variant="outline">Контурна</Button>

              <Button variant="ghost">Текстова</Button>

              <Button variant="success">
                <Check />
                Готово
              </Button>

              <Button variant="destructive">Видалити</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Бейджі</CardTitle>
              <CardDescription>
                Статуси, рівні та короткі підказки.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-3">
              <Badge>Новинка</Badge>

              <Badge variant="neutral">A2</Badge>

              <Badge variant="success">
                <Check />
                Завершено
              </Badge>

              <Badge variant="warning">
                <Flame />
                Серія 7 днів
              </Badge>

              <Badge variant="destructive">
                <CircleAlert />
                Помилка
              </Badge>

              <Badge variant="outline">15 сцен</Badge>
            </CardContent>
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>Продовжити навчання</CardTitle>
              <CardDescription>Coffee Shop · London First Day</CardDescription>
            </CardHeader>

            <CardContent>
              <Progress value={62} label="Прогрес місії" showValue />
            </CardContent>

            <CardFooter className="justify-end">
              <Button>
                Продовжити
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Сьогоднішня ціль</CardTitle>
                  <CardDescription>Виконайте 50 XP за день.</CardDescription>
                </div>

                <Trophy className="size-6 text-warning" />
              </div>
            </CardHeader>

            <CardContent>
              <Progress
                value={25}
                max={50}
                label="25 із 50 XP"
                showValue
                indicatorClassName="bg-success"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
