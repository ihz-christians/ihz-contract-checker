public class TestDebug {
    public static void main(String[] args) {
        double firstMonthRawPrice = 19.99;
        double regularRawPrice = 49.99;
        double increaseRatio = (regularRawPrice - firstMonthRawPrice) / firstMonthRawPrice;
        System.out.println("increaseRatio: " + increaseRatio);
    }
}
