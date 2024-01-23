import { useForm } from "react-hook-form";
import { preventNonNumeric } from "../../utils/utils";
import "./Form.scss";

type DynamicFormProps = {
  schema: Record<string, unknown>;
  onFormSubmit: (data: Record<string | number, string>) => void;
};

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, onFormSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const onSubmit = (data: Record<string | number, string>) => {
    onFormSubmit(data);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setValue(name, value);
  };

  const renderErrorMessage = (errorKey: string) => {
    const errorMessage = errors[errorKey]?.message;
    if (typeof errorMessage === "string") {
      return <span className="error-message">{errorMessage}</span>;
    }
    return null;
  };

  const renderFormControl = (key: string, field: any) => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "password":
        return (
          <div key={key} className="form-field-container">
            <label>
              {field.label}
              {field.required && (
                <span className="form-field-required"> *</span>
              )}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              {...(field.type === "number"
                ? { onKeyDown: preventNonNumeric }
                : {})}
              {...register(key, field.validation)}
              onChange={handleInputChange}
            />
            {errors[key] && renderErrorMessage(key)}
          </div>
        );
      case "select":
        return (
          <div key={key}>
            <label>{field.label}</label>
            <select
              {...register(key, field.validation)}
              onChange={handleInputChange}
            >
              {/* Options for select dropdown */}
              <option value="" disabled selected hidden>
                Please Choose...
              </option>
            </select>
            {errors[key] && renderErrorMessage(key)}
          </div>
        );
      case "checkbox":
        return (
          <div key={key}>
            <label>
              <input
                type="checkbox"
                placeholder={field.placeholder}
                {...register(key, field.validation)}
                onChange={handleInputChange}
              />
              {field.label}
            </label>
            {errors[key] && renderErrorMessage(key)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit(onSubmit)}>
      {/* Render form controls dynamically */}
      {Object.entries(schema).map(([key, field]) =>
        renderFormControl(key, field)
      )}
      <button className="button button--primary" type="submit">
        Submit
      </button>
    </form>
  );
};

export default DynamicForm;
