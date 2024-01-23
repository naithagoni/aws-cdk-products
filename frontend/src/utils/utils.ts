export const preventNonNumeric = (
  event: React.KeyboardEvent<HTMLInputElement>
) => {
  if (["e", "E", "+", "-", ",", "."].includes(event.key)) {
    event.preventDefault();
  }
};
