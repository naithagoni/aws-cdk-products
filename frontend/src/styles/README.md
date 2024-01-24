# `@use`:
  - `@use` is used to import and use styles from another SCSS file in the current file.
  - It creates a private namespace for the imported styles, meaning that variables, mixins, or functions from the imported file are accessed through an alias.
  - `@use` is used for importing styles into a file.

# `@forward`:
  - `@forward` is used to make the styles defined in the current file available for use in other files like a pipe.
  - It allows you to expose certain styles or functionalities to other SCSS files, making them accessible as if they were defined in the importing file.
  - `@forward` is used for exposing styles from a file for use in other files.

## Advantages of using `@use` and `@forward` over `@import`:
1. **Scope and Encapsulation:**

  - **Namespace Management:** With `@use`, you can create a namespace for imported styles, variables, functions, and mixins. This helps to avoid naming conflicts. For example, if two different stylesheets define a `$primary-color` variable, `@use` allows you to keep them separate.

  - **Encapsulation:** Styles, variables, mixins, and functions imported with `@use` are not automatically global. This reduces the risk of unintended side effects and global namespace pollution.

2. **Partial Loading:**

  - **Load Once:** A file loaded with `@use` is only included once, no matter how many times it is used. With `@import`, the file is included and processed every time it is imported, which can lead to duplicated styles and less efficient processing.

3. **Modular Architecture:**

  - **Explicit Dependencies:** `@use` makes dependencies between files explicit, improving the readability and maintainability of the code. It's clear which file is using which other files functionalities.

  - **Forwarding:** `@forward` lets you build a public API for your stylesheet, allowing other stylesheets to access only the parts you want to expose. This is great for module authors and helps in maintaining a clean and controlled exposure of styles and variables.

4. **Better Organization:**

  - **Cleaner Codebase:** With `@use` and `@forward`, you can structure your codebase in a more modular and organized way. It encourages the creation of small, focused, and reusable stylesheets.

5. **Future-Proofing:**

  - **Alignment with CSS:** The `@use` rule is more aligned with how modern CSS handles modules (like with CSS Modules). This makes your stylesheets more consistent with current and future CSS standards.

  - **Deprecation of `@import`:** Sass plans to gradually phase out `@import` as `@use` and `@forward` offer better functionality and fewer drawbacks. Transitioning to `@use` and `@forward` future-proofs your stylesheets.