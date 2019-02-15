//todo:
// make histogram which will show the VQ ratios of the different segments
// make it changeable so that you can shift it left, right, and widen it out, make 2 peaks...
// ?? visual representation of the segments with colors representing saturation
// make it for CO2 too? (http://www.meddean.luc.edu/lumen/MedEd/medicine/pulmonar/physio/pf4.htm)

//note corrective factors - shifting up by adding 10 to the Hb dissociation curve
// adding an Fi of 0.4 to boost saturations
//all to keep a VQ of 1 as optimal

//universal variables
var FiO2 = 0.2;
FiO2 = FiO2 + 0.4; //corrective factor due to aberrancy in Hb dissociation curve
var Vte = 5; //minute ventilation
var CO = 5; //cardiac output
var Hb = 13; //grams of Hb in blood
var SatPulmArtery = 70; //saturation of mixed venous blood
var Patm = 713; //atmospheric pressure 
var SatPulmVein = SatPulmArtery;

var text ="";


var findEquilibriumPaO2 = function(FVte, Fco) {
    /*decrease Content of Oxygen in segment by slowly adding Saturation to blood 
    until pressure in blood and segment the same
    */
    //var FVte = 0.5; //fraction of minute ventilation reaching segment
    //var Fco = 0.5; //fraction of CO reaching segment
    var mySatPulmVein = SatPulmVein;
    var PAO2_Initial = FiO2 * Patm;
    var PAO2 = PAO2_Initial;
    var O2ContentSegment_Initial = FiO2 * Vte * FVte * 1000;
    var O2ContentSegment = O2ContentSegment_Initial;


    while ((PO2fromSat(mySatPulmVein) < PAO2) && (mySatPulmVein < 100)) {
        /*
        1. Add 0.1% saturation to Pulm Vein
        2. Calculate how much O2 has been removed from the Air in the segment
        3. Calculate how much the PAO2 becomes
        4. If the PaO2 and PAO2 are the same or Pa makes sat 100%: then stop
        */
        mySatPulmVein = mySatPulmVein + 0.1;

        O2ContentSegment = O2ContentSegment - 10 * CO * Fco * Hb * 1.34 * 0.01; //dL/L*L/min * cc/dL
        if (O2ContentSegment <= 0) {
            PAO2 = PO2fromSat(mySatPulmVein);
            console.log("broke")
            break;
        }
        PAO2 = PAO2_Initial * O2ContentSegment / O2ContentSegment_Initial;

    }
    
    return {
        "venousSaturation": mySatPulmVein,
        "PAO2": PAO2
    };


};

$(document).ready(
    function(){
        
        $MinuteVentilationFraction = $("#minuteVentilationFraction");
        $MinuteVentilationFractionLabel = $("label[for='minuteVentilationFraction']")
        $CardiacOutputFraction = $("#cardiacOutputFraction");
          $CardiacOutputFractionLabel = $("label[for='cardiacOutputFraction']")
        $ResultLabel = $("#result")
        
        $MinuteVentilationFractionLabel.text($MinuteVentilationFraction.val())
        $CardiacOutputFractionLabel.text($CardiacOutputFraction.val())
        
        $MinuteVentilationFraction.change(function(){
            refreshValues();
            
        });
        
             $CardiacOutputFraction.change(function(){
            refreshValues();
            
        });

function refreshValues(){
            $MinuteVentilationFractionLabel.text($MinuteVentilationFraction.val())
                    $CardiacOutputFractionLabel.text($CardiacOutputFraction.val())

          $ResultLabel.text(findEquilibriumPaO2($MinuteVentilationFraction.val()*Vte,$CardiacOutputFraction.val()*CO).venousSaturation.toFixed(1)+"%");

}
refreshValues();

    }
    )

//document.getElementById("mainContent").innerHTML = text;
