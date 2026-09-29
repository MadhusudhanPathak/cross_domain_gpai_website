import { Route, Switch } from "wouter";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Process } from "./pages/Process";
import { FormPage } from "./pages/FormPage";
import { Done } from "./pages/Done";
import { Privacy } from "./pages/Privacy";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/process" component={Process} />
        <Route path="/forms/:formId/done">{(params) => <Done formId={params.formId} />}</Route>
        <Route path="/forms/:formId">{(params) => <FormPage formId={params.formId} />}</Route>
        <Route path="/privacy" component={Privacy} />
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Layout>
  );
}
