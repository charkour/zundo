import { Button } from 'ui';
import { test } from 'zundo';

export default function Web() {
  return (
    <div>
      <h1>Web</h1>
      <button onClick={test}>Test</button>
      <Button />
    </div>
  );
}
