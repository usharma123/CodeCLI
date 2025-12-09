import java.text.DecimalFormat;

/**
 * CLI entry point: java CurrencyApp <amount> <from> <to>
 */
public class CurrencyApp {
    public static void main(String[] args) {
        if (args.length != 3) {
            System.err.println("Usage: java CurrencyApp <amount> <from> <to>");
            System.exit(1);
        }

        double amount;
        try {
            amount = Double.parseDouble(args[0]);
        } catch (NumberFormatException e) {
            System.err.println("Amount must be a number");
            System.exit(1);
            return;
        }

        CurrencyConverter converter = new CurrencyConverter();
        double result;
        try {
            result = converter.convert(amount, args[1], args[2]);
        } catch (IllegalArgumentException ex) {
            System.err.println(ex.getMessage());
            System.exit(1);
            return;
        }

        DecimalFormat df = new DecimalFormat("0.00");
        System.out.println(df.format(result));
    }
}
