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
//FiO2 = FiO2 + 0.4; //corrective factor due to aberrancy in Hb dissociation curve
var Vte = 5; //minute ventilation
var CO = 5; //cardiac output
var Hb = 13; //grams of Hb in blood
var SatPulmArtery = 70; //saturation of mixed venous blood
var Patm = 713; //atmospheric pressure 
var SatPulmVein = SatPulmArtery;

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
            O2ContentSegment = 0;
            console.log("broke");
            break;
        }
        PAO2 = PAO2_Initial * O2ContentSegment / O2ContentSegment_Initial;

    }

    return {
        "venousSaturation": mySatPulmVein,
        "PAO2": PAO2,
        "O2ContentSegment": 10 * CO * Fco * Hb * 1.34 * mySatPulmVein
    };
};

var findEquilibriumPaO2SmallSegment = function(vt, co) {
    /*decrease Content of Oxygen in segment by slowly adding Saturation to blood 
    until pressure in blood and segment the same
    */
    //var FVte = 0.5; //fraction of minute ventilation reaching segment
    //var Fco = 0.5; //fraction of CO reaching segment
    var mySatPulmVein = SatPulmVein;
    var PAO2_Initial = FiO2 * Patm;
    var PAO2 = PAO2_Initial;
    var O2ContentSegment_Initial = FiO2 * vt;
    var O2ContentSegment = O2ContentSegment_Initial;

    while ((PO2fromSat(mySatPulmVein) < PAO2) && (mySatPulmVein < 100)) {
        /*
        1. Add 0.5% saturation to Pulm Vein
        2. Calculate how much O2 has been removed from the Air in the segment
        3. Calculate how much the PAO2 becomes
        4. If the PaO2 and PAO2 are the same or Pa makes sat 100%: then stop
        */
        mySatPulmVein = mySatPulmVein + 0.5;

        O2ContentSegment = O2ContentSegment - ((co / 100) * Hb * 1.34 * 0.005)
      //  console.log(O2ContentSegment, (co / 100) * Hb * 1.34 * 0.005, PO2fromSat(mySatPulmVein))
        if (O2ContentSegment <= 0) {
            PAO2 = PO2fromSat(mySatPulmVein);
            O2ContentSegment = 0;
            console.log("too much oxygen removed from blood");
            break;
        }
        PAO2 = PAO2_Initial * O2ContentSegment / O2ContentSegment_Initial;
       // console.log(PAO2 - PO2fromSat(mySatPulmVein))

    }


    return {
        "venousSaturation": mySatPulmVein,
        "PAO2": PAO2,
        "O2ContentSegment": ((co / 100) * Hb * 1.34 * (mySatPulmVein / 100))
            //dL/min  gm/dL   1.34 cc/gm 
    };
};


//give total pulmonary venous blood PaO2, saturation, content


// n = 6 gives a good enough approximation
// function rnd2() {
//     return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
// }

// function rnd20() {
//     return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 20) / 20;
// }

// function rnd12() {
//     return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 6) / 6;
// }

function rnd6() {
    return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
}

var cachedRnd6 = function() {
    var randomNumberArray = [];
    console.time("randomization");

    for (var i = 0; i < 2000; i++) {
        randomNumberArray.push(((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3);
    }
    console.timeEnd("randomization");
    return function() {
        return randomNumberArray.pop();
    };

}();


//avgCO*mean will be the averageCO
//avgVT*mean will be averageVT

var lungSegmentArray = [];
var totalCO = 0;
var totalVT = 0;

function distribute(f, segments, COMean, VTMean, color) {
    //CO and VT are averages that are specific to these segments
    //can make more segments with different CO and VT distributions (less or more)
    //COMean per segment * number of segments is the average cardiac output that's going to these segments
    //VTMean per segment * number of segments is the average VT going to these segments

    var CODistribution = [];
    var VTDistribution = [];
    var VQDistribution = [];
    var randomCO, randomVT;

    /*to increase average cardiac output you need to increase the mean (here 10) to 20. 
   The distribution would be twice mean -  40 then
     */
    console.time("distribution");

    for (var i = 0; i < 40; i++) CODistribution[i] = 0;
    for (var i = 0; i < 40; i++) VTDistribution[i] = 0;
    for (var i = 0; i < 40; i++) VQDistribution[i] = 0;

    for (var i = 0; i < segments; i++) {
        randomCO = COMean + Math.round(7* f());
        randomVT = VTMean + Math.round(7 * f());
        // the number in the Math.round is the width of the curve. 
        //making object containing these characteristics
        lungSegmentArray.push({
            "CO": randomCO,
            "VT": randomVT,
            "VQ": randomVT / randomCO
        });

        CODistribution[randomCO]++;
        VTDistribution[randomVT]++;
        VQDistribution[(randomVT * 10 / randomCO).toFixed(0)]++;

        totalCO += randomCO;
        totalVT += randomVT;
        console.timeEnd("distribution");

    }


    //graphics portion
    console.time("graphics");
    for (var i = 0; i < 40; i++) {
        $('#container').append($('<div>').css({
            left: 10 * i + 'px',
            "min-width": '10px',
            "opacity": 0.5,

            height: CODistribution[i] * 5000 / totalCO + 'px',
            background: "Red"
        }));
    }

    for (var i = 0; i < 40; i++) {
        $('#container').append($('<div>').css({
            left: 10 * i + 'px',
            "min-width": "10px",
            "opacity": 0.5,
            height: VTDistribution[i] * 5000 / totalVT + 'px',
            background: "Blue"
        }));
    }

    for (var i = 0; i < 40; i++) {
        $('#container').append($('<div>').css({
            left: 100 + 10 * i + 'px',
            "min-width": "10px",
            "opacity": 0.9,
            height: VQDistribution[i] * 500 / segments + 'px',
            background: "Black",
            "drop-shadow": "1px 1px 3px #888888"
        }));
    }

    for (var i = 0; i < 40; i++) {
        $('#container').append($('<div>').css({
            top: "0px",
            left: 100 + 10 * i + 'px',
            "min-width": "10px",
            "font-size": "5px",
            "opacity": 0.9
        }).html((i / 10).toFixed(1)));
    }
    console.timeEnd("graphics")


}

//count will be 500 segments

distribute(rnd6, 500, 10, 10, 'rgba(0,128,0,.6)');

console.time("findEquilibrium");
$.each(lungSegmentArray, function(i, o) {
    var thisSegmentEquil = findEquilibriumPaO2SmallSegment(o.VT, o.CO);
    o.venousSaturation = thisSegmentEquil.venousSaturation;
    o.PAO2 = thisSegmentEquil.PAO2;
    o.O2ContentSegment = thisSegmentEquil.O2ContentSegment;
});
console.timeEnd("findEquilibrium");

var calculateTotalSat = function() {
    var oxygenContentTotal = 0;
    $.each(lungSegmentArray, function(i, o) {
        oxygenContentTotal += Number(o.O2ContentSegment);
    });

    var saturationOfArterialBlood = oxygenContentTotal / ((totalCO * Hb * 1.34) / 100);
    //    cc/min g/dL cc/g
    console.log((saturationOfArterialBlood * 100).toFixed(1), "%", oxygenContentTotal, ((totalCO * Hb * 1.34) / 100));
}();