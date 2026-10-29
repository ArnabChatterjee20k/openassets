import { useRoute } from './router';
import { Home } from './pages/Home';
import { DropPage } from './pages/DropPage';
import { AssetPage } from './pages/AssetPage';
import { RenderPage } from './pages/RenderPage';

export function App() {
  const { path, query } = useRoute();

  // Headless render target for CI: no chrome, no layout.
  if (path.startsWith('/render/')) return <RenderPage id={path.slice('/render/'.length)} query={query} />;

  let page;
  if (path.startsWith('/drop/')) page = <DropPage date={path.slice('/drop/'.length)} />;
  else if (path.startsWith('/asset/')) page = <AssetPage key={path} id={path.slice('/asset/'.length)} query={query} />;
  else page = <Home />;

  return (
    <div className="shell">
      <header className="topbar">
        <a href="#/" className="brand">
          Generative Assets
        </a>
      </header>
      <main>{page}</main>
    </div>
  );
}
