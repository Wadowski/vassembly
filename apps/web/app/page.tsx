import { TaskInputComposer } from './_components/TaskInputComposer/TaskInputComposer';
import styles from './page.module.scss';

const HomePage = (): JSX.Element => {
  return (
    <main className={styles.page}>
      <TaskInputComposer />
    </main>
  );
};

export default HomePage;
