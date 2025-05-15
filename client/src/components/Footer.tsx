import { Link } from "wouter";
import { BookMarked } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-light">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white">
                <BookMarked className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-dark">
                ShitHappens
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-all">
              Поділіться своїми короткими історіями зі світом.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark tracking-wider uppercase">
              Навігація
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Головна сторінка
                </Link>
              </li>
              <li>
                <Link
                  href="/random"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Випадкова історія
                </Link>
              </li>
              <li>
                <Link
                  href="/expiring"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Незабаром закінчуються
                </Link>
              </li>
              <li>
                <Link
                  href="/my-stories"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Мої історії
                </Link>
              </li>
              <li>
                <Link
                  href="/stats"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Статистика
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-light pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-sm text-muted-all mx-auto">
            &copy; {new Date().getFullYear()} ShitHappens. Усі права захищені.
          </p>
        </div>
      </div>
    </footer>
  );
}
