import { Field, fieldInputClass } from './Field'

// Shared Cost + "Per (editable)" unit pair, copy-pasted across all four Custom*Form components before this extraction.
export function CostUnitField({
  testIdPrefix,
  cost,
  costUnit,
  onCostChange,
  onCostUnitChange,
}: {
  testIdPrefix: string
  cost: string
  costUnit: string
  onCostChange: (value: string) => void
  onCostUnitChange: (value: string) => void
}) {
  return (
    <div className="col-span-full flex gap-2">
      <Field label="Cost" extraClassName="flex-1">
        <input
          data-testid={`${testIdPrefix}-cost-input`}
          type="number"
          min={0}
          placeholder="0"
          value={cost}
          onChange={(e) => onCostChange(e.target.value)}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Per (editable)" extraClassName="flex-1">
        <input
          data-testid={`${testIdPrefix}-cost-unit-input`}
          value={costUnit}
          onChange={(e) => onCostUnitChange(e.target.value)}
          className={fieldInputClass}
        />
      </Field>
    </div>
  )
}
