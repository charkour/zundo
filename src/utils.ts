// TODO: make this a better type
export const filterState = (state: any, ignored: string[] = []) => {
  const filteredState: any = {};
  Object.keys(state).forEach((key: string) => {
    if (!ignored.includes(key)) {
      filteredState[key] = state[key];
    }
  });
  return filteredState;
};
